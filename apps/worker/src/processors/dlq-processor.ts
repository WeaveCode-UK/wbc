import { Worker, Job } from 'bullmq';
import { connection } from '../lib/redis';
import { logger } from '../lib/logger';

export interface DLQJob {
  originalQueue: string;
  originalJobId: string;
  error: string;
  payload: unknown;
}

async function processDLQJob(job: Job<DLQJob>): Promise<void> {
  logger.warn({
    jobId: job.id,
    originalQueue: job.data.originalQueue,
    originalJobId: job.data.originalJobId,
    error: job.data.error,
  }, 'Dead letter queue job — logging for manual review');
}

export function startDLQWorker(): Worker<DLQJob> {
  const worker = new Worker('wbc:dlq', processDLQJob, {
    connection,
    concurrency: 1,
  });

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'DLQ job processed');
  });

  return worker;
}
