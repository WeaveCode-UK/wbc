import type { Job } from "bullmq";
import { Worker } from "bullmq";
import { connection } from "../lib/redis";
import { logger } from "../lib/logger";

export interface ScheduleJob {
  type: "REMINDER_CHECK" | "APPOINTMENT_NOTIFY" | "BIRTHDAY_CHECK";
  tenantId: string;
}

async function processScheduleJob(job: Job<ScheduleJob>): Promise<void> {
  logger.info(
    { jobId: job.id, type: job.data.type },
    "Processing schedule job",
  );
  // Processor logic to be implemented when schedule automation is complete
}

export function startScheduleWorker(): Worker<ScheduleJob> {
  const worker = new Worker("wbc:schedule", processScheduleJob, {
    connection,
    concurrency: 3,
  });

  worker.on("completed", (job) => {
    logger.info({ jobId: job.id }, "Schedule job completed");
  });

  worker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, error: err.message }, "Schedule job failed");
  });

  return worker;
}
