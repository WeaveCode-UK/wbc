import { Worker, Job } from "bullmq";
import { connection } from "../lib/redis";
import { logger } from "../lib/logger";
import { PrismaCampaignRepository } from "../../../../packages/business/campaigns/adapters/prisma-campaign-repository";
import { JOB_QUEUES, logIfInvalidJobData, withTenant } from "@wbc/shared";

const campaignRepo = new PrismaCampaignRepository();

export interface CampaignJob {
  tenantId: string;
  campaignId: string;
}

async function processCampaignJob(job: Job<CampaignJob>): Promise<void> {
  // ACH-012 apis-integracoes: see analytics-processor; warn-only drift log.
  logIfInvalidJobData(JOB_QUEUES.CAMPAIGNS, job.name, job.data);
  const { tenantId, campaignId } = job.data;
  logger.info(
    { jobId: job.id, jobName: job.name, campaignId, tenantId },
    "Processing campaign job",
  );

  await withTenant(tenantId, async () => {
    if (job.name === "send-campaign") {
      const recipients = await campaignRepo.getRecipients(
        tenantId,
        campaignId,
        "PENDING",
      );
      logger.info(
        { campaignId, recipientCount: recipients.length },
        "Dispatching campaign messages",
      );
      await campaignRepo.updateStatus(tenantId, campaignId, "SENDING");

      for (const recipient of recipients) {
        logger.info(
          { campaignId, clientId: recipient.clientId },
          "Sending to recipient",
        );
        // Message sending will be handled by messaging processor via events
      }

      await campaignRepo.updateStatus(tenantId, campaignId, "COMPLETED");
      logger.info({ campaignId, tenantId }, "Campaign dispatch completed");
    }
  });
}

export function startCampaignWorker(): Worker<CampaignJob> {
  const worker = new Worker("wbc:campaigns", processCampaignJob, {
    connection,
    concurrency: 2,
  });

  worker.on("completed", (job) => {
    logger.info({ jobId: job.id }, "Campaign job completed");
  });

  worker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, error: err.message }, "Campaign job failed");
  });

  return worker;
}
