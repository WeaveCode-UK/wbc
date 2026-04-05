import type { EventType } from './domain-event';

export type EventHandler = (event: { type: string; tenantId: string; payload: unknown }) => Promise<void>;

const handlers = new Map<string, EventHandler[]>();
const processedEvents = new Set<string>();

const HANDLER_TIMEOUT_MS = 30_000;

export function subscribe(type: EventType, handler: EventHandler): void {
  const existing = handlers.get(type) ?? [];
  existing.push(handler);
  handlers.set(type, existing);
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Handler timeout after ${ms}ms`)), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); },
    );
  });
}

export async function dispatch(event: {
  id: string;
  type: string;
  tenantId: string;
  payload: unknown;
}): Promise<void> {
  if (processedEvents.has(event.id)) {
    return;
  }

  const eventHandlers = handlers.get(event.type) ?? [];

  const results = await Promise.allSettled(
    eventHandlers.map((handler) =>
      withTimeout(handler(event), HANDLER_TIMEOUT_MS),
    ),
  );

  for (const result of results) {
    if (result.status === 'rejected') {
      console.error(`[EventDispatch] Handler failed for ${event.type}:`, result.reason);
    }
  }

  processedEvents.add(event.id);

  if (processedEvents.size > 10000) {
    const iterator = processedEvents.values();
    const first = iterator.next().value;
    if (first) processedEvents.delete(first);
  }
}

export function getRegisteredHandlers(): Map<string, EventHandler[]> {
  return handlers;
}
