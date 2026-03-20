import { PrismaOutboxRepository } from '@wbc/db';
import { dispatch, withTenant } from '@wbc/shared';
import { logger } from '../lib/logger';

const outboxRepo = new PrismaOutboxRepository();
const BATCH_SIZE = 50;

export async function processOutbox(): Promise<void> {
  const events = await outboxRepo.getPending(BATCH_SIZE);

  for (const event of events) {
    try {
      await withTenant(event.tenantId, async () => {
        await dispatch({
          id: event.id,
          type: event.type,
          tenantId: event.tenantId,
          payload: event.payload,
        });
      });
      await outboxRepo.markProcessed(event.id);
    } catch (error) {
      logger.error({ eventId: event.id, type: event.type, error }, 'Failed to process outbox event');
      await outboxRepo.markFailed(event.id);
    }
  }
}
