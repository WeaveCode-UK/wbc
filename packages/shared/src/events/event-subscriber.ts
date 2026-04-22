import type { EventType } from "./domain-event";

// ACH-002 confiabilidade-resiliencia: expose event `id` to handlers so
// they can claim idempotency via ProcessedEventRepository keyed on
// (eventId, handlerName). Dispatch has always passed `id` at runtime;
// the type just didn't advertise it.
export type EventHandler = (event: {
  id: string;
  type: string;
  tenantId: string;
  payload: unknown;
}) => Promise<void>;

const handlers = new Map<string, EventHandler[]>();

// ACH-004 confiabilidade-resiliencia: per-handler timeout is now env-
// configurable (HANDLER_TIMEOUT_MS) so ops can lower it during an
// incident without redeploy. Default 30s keeps previous behavior.
const HANDLER_TIMEOUT_MS = Number.parseInt(
  process.env.HANDLER_TIMEOUT_MS ?? "30000",
  10,
);

export class HandlerTimeoutError extends Error {
  constructor(public readonly timeoutMs: number) {
    super(`Handler timeout after ${timeoutMs}ms`);
    this.name = "HandlerTimeoutError";
  }
}

export function subscribe(type: EventType, handler: EventHandler): void {
  const existing = handlers.get(type) ?? [];
  existing.push(handler);
  handlers.set(type, existing);
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new HandlerTimeoutError(ms)), ms);
    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

export async function dispatch(event: {
  id: string;
  type: string;
  tenantId: string;
  payload: unknown;
}): Promise<void> {
  // ACH-001 confiabilidade: previously used Promise.allSettled and only
  // logged rejections, so dispatch always resolved. The outbox processor
  // then marked events as PROCESSED even when every handler failed,
  // leaving invariants broken (sale confirmed with no stock decrement).
  // Now: if any handler rejects, throw an AggregateError carrying every
  // failure so the caller (outbox-processor) calls markFailed and the
  // event goes back to PENDING with backoff.
  const eventHandlers = handlers.get(event.type) ?? [];

  const results = await Promise.allSettled(
    eventHandlers.map((handler) =>
      withTimeout(handler(event), HANDLER_TIMEOUT_MS),
    ),
  );

  const failures: unknown[] = [];
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      const handler = eventHandlers[index];
      const handlerName = handler?.name || `handler#${index}`;
      const reason = result.reason;
      const isTimeout = reason instanceof HandlerTimeoutError;
      console.error(
        `[EventDispatch] Handler ${handlerName} ${isTimeout ? "TIMEOUT" : "failed"} for ${event.type} (event ${event.id}):`,
        reason,
      );
      failures.push({ handlerName, reason, isTimeout });
    }
  });

  if (failures.length > 0) {
    throw new AggregateError(
      failures.map((f) => (f as { reason: unknown }).reason),
      `EventDispatch: ${failures.length}/${results.length} handler(s) failed for ${event.type} (event ${event.id})`,
    );
  }
}

export function getRegisteredHandlers(): Map<string, EventHandler[]> {
  return handlers;
}
