import { PrismaOutboxRepository } from '@wbc/db';
import { logger } from '../lib/logger';
import { dlqQueue } from '../queues/index';

const outboxRepo = new PrismaOutboxRepository();

export async function scanFailedForDLQ(): Promise<void> {
  const failed = await outboxRepo.getFailedForDLQ(20);
  if (failed.length === 0) return;

  for (const event of failed) {
    await dlqQueue.add('outbox-dead-letter', {
      originalQueue: 'outbox',
      originalJobId: event.id,
      error: `Failed after ${event.attempts} attempts`,
      payload: { type: event.type, tenantId: event.tenantId, payload: event.payload },
    });
    await outboxRepo.markDLQ(event.id);
    logger.warn({
      eventId: event.id,
      type: event.type,
      tenantId: event.tenantId,
      attempts: event.attempts,
    }, 'Outbox event moved to DLQ');
  }

  logger.info({ count: failed.length }, 'DLQ scan completed');
}
