import { Worker, Job } from 'bullmq';
import { connection } from '../lib/redis';
import { logger } from '../lib/logger';

export interface AnalyticsJob {
  type: 'RECALCULATE_ABC' | 'UPDATE_ENGAGEMENT' | 'DAILY_STATS';
  tenantId: string;
}

async function processAnalyticsJob(job: Job<AnalyticsJob>): Promise<void> {
  logger.info({ jobId: job.id, type: job.data.type }, 'Processing analytics job');
  // Processor logic to be implemented when analytics automation is complete
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
