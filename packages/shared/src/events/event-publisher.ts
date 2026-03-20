import { randomUUID } from 'crypto';
import type { DomainEvent, EventType } from './domain-event';
import type { OutboxPort } from './outbox-service';

let outboxPort: OutboxPort | null = null;

export function setOutboxPort(port: OutboxPort): void {
  outboxPort = port;
}

export async function publish<T>(
  type: EventType,
  tenantId: string,
  payload: T,
): Promise<void> {
  if (!outboxPort) {
    throw new Error('OutboxPort not initialized. Call setOutboxPort() at startup.');
  }

  const event: DomainEvent<T> = {
    id: randomUUID(),
    type,
    tenantId,
    payload,
    timestamp: new Date(),
    version: 1,
  };

  await outboxPort.save(event);
}
