import { Worker, Job } from 'bullmq';
import { connection } from '../lib/redis';
import { logger } from '../lib/logger';

export interface MessagingJob {
  type: 'SEND_TEXT' | 'SEND_AUDIO' | 'SEND_SCHEDULED';
  tenantId: string;
  clientId: string;
  message?: string;
  audioUrl?: string;
}

async function processMessagingJob(job: Job<MessagingJob>): Promise<void> {
  logger.info({ jobId: job.id, type: job.data.type }, 'Processing messaging job');
  // Processor logic to be implemented when WhatsApp N2 integration is complete
}

export function startMessagingWorker(): Worker<MessagingJob> {
  const worker = new Worker('wbc:messaging', processMessagingJob, {
    connection,
    concurrency: 5,
  });

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Messaging job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err.message }, 'Messaging job failed');
  });

  return worker;
}
