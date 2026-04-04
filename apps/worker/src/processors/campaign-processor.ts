import { Worker, Job } from 'bullmq';
import { connection } from '../lib/redis';
import { logger } from '../lib/logger';

export interface CampaignJob {
  type: 'DISPATCH_CAMPAIGN';
  tenantId: string;
  campaignId: string;
  recipientCount: number;
}

async function processCampaignJob(job: Job<CampaignJob>): Promise<void> {
  logger.info({ jobId: job.id, campaignId: job.data.campaignId }, 'Processing campaign job');
  // Processor logic to be implemented when campaign dispatch is complete
}

export function startCampaignWorker(): Worker<CampaignJob> {
  const worker = new Worker('wbc:campaigns', processCampaignJob, {
    connection,
    concurrency: 2,
  });

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Campaign job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err.message }, 'Campaign job failed');
  });

  return worker;
}
