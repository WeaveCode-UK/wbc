import { Worker, Job } from 'bullmq';
import { connection } from '../lib/redis';
import { logger } from '../lib/logger';
import { PrismaAnalyticsRepository } from '../../../../packages/business/analytics/adapters/prisma-analytics-repository';
import { withTenant } from '@wbc/shared';

const analyticsRepo = new PrismaAnalyticsRepository();

export interface AnalyticsJob {
  tenantId: string;
}

async function processAnalyticsJob(job: Job<AnalyticsJob>): Promise<void> {
  const { tenantId } = job.data;
  logger.info({ jobId: job.id, jobName: job.name, tenantId }, 'Processing analytics job');

  await withTenant(tenantId, async () => {
    if (job.name === 'recalculate-abc') {
      const result = await analyticsRepo.calculateABCClassification(tenantId);
      logger.info({ jobId: job.id, tenantId, updated: result.updated }, 'ABC classification completed');
    }
  });
}

export function startAnalyticsWorker(): Worker<AnalyticsJob> {
  const worker = new Worker('wbc:analytics', processAnalyticsJob, {
    connection,
    concurrency: 1,
  });

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Analytics job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err.message }, 'Analytics job failed');
  });

  return worker;
}
