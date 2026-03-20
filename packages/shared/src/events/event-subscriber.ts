import type { EventType } from './domain-event';

export type EventHandler = (event: { type: string; tenantId: string; payload: unknown }) => Promise<void>;

const handlers = new Map<string, EventHandler[]>();
const processedEvents = new Set<string>();

export function subscribe(type: EventType, handler: EventHandler): void {
  const existing = handlers.get(type) ?? [];
  existing.push(handler);
  handlers.set(type, existing);
}

export async function dispatch(event: {
  id: string;
  type: string;
  tenantId: string;
  payload: unknown;
}): Promise<void> {
  // Idempotency check
  if (processedEvents.has(event.id)) {
    return;
  }

  const eventHandlers = handlers.get(event.type) ?? [];

  for (const handler of eventHandlers) {
    await handler(event);
  }

  processedEvents.add(event.id);

  // Prevent memory leak — keep only last 10000 event IDs
  if (processedEvents.size > 10000) {
    const iterator = processedEvents.values();
    const first = iterator.next().value;
    if (first) processedEvents.delete(first);
  }
}

export function getRegisteredHandlers(): Map<string, EventHandler[]> {
  return handlers;
}
