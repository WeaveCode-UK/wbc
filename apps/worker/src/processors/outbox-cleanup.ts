import { prisma } from '@wbc/db';
import { logger } from '../lib/logger';

const RETENTION_DAYS = 30;

export async function cleanupProcessedOutboxEvents(): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

  const result = await prisma.outboxEvent.deleteMany({
    where: {
      status: 'PROCESSED',
      processedAt: { lt: cutoffDate },
    },
  });

  if (result.count > 0) {
    logger.info({ count: result.count, retentionDays: RETENTION_DAYS }, 'Outbox cleanup: deleted processed events');
  }

  return result.count;
}
