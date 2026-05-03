import type { Job } from "bullmq";
import { Worker, Queue } from "bullmq";
import { connection } from "../lib/redis";
import { logger } from "../lib/logger";
import { PrismaCampaignRepository } from "../../../../packages/business/campaigns/adapters/prisma-campaign-repository";
import { JOB_QUEUES, logIfInvalidJobData, withTenant } from "@wbc/shared";

const campaignRepo = new PrismaCampaignRepository();

// ACH-004 performance-escalabilidade: split recipients into bounded
// chunks so a campaign with thousands of recipients doesn't produce
// one long-running job per recipient — the messaging queue picks up
// chunk-level jobs and fans out internally, which keeps the campaign
// processor free to accept the next campaign.
const DISPATCH_CHUNK_SIZE = 50;

export interface CampaignJob {
  tenantId: string;
  campaignId: string;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
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

      // ACH-004: enqueue chunk-level `send-bulk` jobs on the messaging
      // queue in parallel (Promise.all). Each chunk carries its own
      // idempotency key (campaignId + chunk index) so a retry doesn't
      // resend the same recipients.
      const messagingQueue = new Queue(JOB_QUEUES.MESSAGING, { connection });
      const chunks = chunk(
        recipients.map((r) => r.clientId),
        DISPATCH_CHUNK_SIZE,
      );
      try {
        await Promise.all(
          chunks.map((clientIds, idx) =>
            messagingQueue.add(
              "send-bulk",
              {
                type: "SEND_TEXT",
                tenantId,
                campaignId,
                clientIds,
                idempotencyKey: `campaign:${campaignId}:chunk:${idx}`,
              },
              { jobId: `campaign:${campaignId}:chunk:${idx}` },
            ),
          ),
        );
      } finally {
        await messagingQueue.close();
      }

      await campaignRepo.updateStatus(tenantId, campaignId, "COMPLETED");
      logger.info(
        { campaignId, tenantId, chunks: chunks.length },
        "Campaign dispatch enqueued",
      );
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
