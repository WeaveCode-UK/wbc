import type { EventType } from "./domain-event";

export type EventHandler = (event: {
  type: string;
  tenantId: string;
  payload: unknown;
}) => Promise<void>;

const handlers = new Map<string, EventHandler[]>();

const HANDLER_TIMEOUT_MS = 30_000;

export function subscribe(type: EventType, handler: EventHandler): void {
  const existing = handlers.get(type) ?? [];
  existing.push(handler);
  handlers.set(type, existing);
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Handler timeout after ${ms}ms`)),
      ms,
    );
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
      console.error(
        `[EventDispatch] Handler ${handlerName} failed for ${event.type} (event ${event.id}):`,
        result.reason,
      );
      failures.push({ handlerName, reason: result.reason });
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
