import { Worker, Job } from "bullmq";
import { JOB_QUEUES, logIfInvalidJobData } from "@wbc/shared";
import { connection } from "../lib/redis";
import { logger } from "../lib/logger";

export interface MessagingJob {
  type: "SEND_TEXT" | "SEND_AUDIO" | "SEND_SCHEDULED";
  tenantId: string;
  clientId: string;
  message?: string;
  audioUrl?: string;
}

async function processMessagingJob(job: Job<MessagingJob>): Promise<void> {
  // ACH-012 apis-integracoes: warn-only drift log before handling.
  logIfInvalidJobData(JOB_QUEUES.MESSAGING, job.name, job.data);
  logger.info(
    { jobId: job.id, type: job.data.type },
    "Processing messaging job",
  );
  // Processor logic to be implemented when WhatsApp N2 integration is complete
}

export function startMessagingWorker(): Worker<MessagingJob> {
  const worker = new Worker("wbc:messaging", processMessagingJob, {
    connection,
    concurrency: 5,
    // ACH-010 performance-escalabilidade: outbound rate limit for the
    // Meta WhatsApp tier. Meta's business tier is conservatively 10
    // msg/s per phone number before 429; tune via env when a higher
    // tier is approved. `limiter.max` / `limiter.duration` are
    // BullMQ-level — they slow *this worker's* dispatch, not the
    // queue's enqueue side.
    limiter: {
      max: Number(process.env.MESSAGING_RATE_MAX ?? 10),
      duration: Number(process.env.MESSAGING_RATE_DURATION_MS ?? 1000),
    },
  });

  worker.on("completed", (job) => {
    logger.info({ jobId: job.id }, "Messaging job completed");
  });

  worker.on("failed", (job, err) => {
    logger.error(
      { jobId: job?.id, error: err.message },
      "Messaging job failed",
    );
  });

  return worker;
}
