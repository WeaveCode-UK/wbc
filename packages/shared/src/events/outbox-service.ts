import type { DomainEvent } from './domain-event';

export interface OutboxPort {
  save(event: DomainEvent): Promise<void>;
  saveBatch(events: DomainEvent[]): Promise<void>;
  getPending(limit: number): Promise<Array<{ id: string; type: string; tenantId: string; payload: unknown }>>;
  markProcessed(id: string): Promise<void>;
  markFailed(id: string): Promise<void>;
}
