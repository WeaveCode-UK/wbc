import { Worker, Job } from "bullmq";
import { connection } from "../lib/redis";
import { logger } from "../lib/logger";

export interface DLQJob {
  originalQueue: string;
  originalJobId: string;
  error: string;
  payload: unknown;
  // ACH-020 apis-integracoes: richer context set by the DLQ scanner so
  // ops can correlate to the original job without digging through
  // Redis manually.
  tenantId?: string;
  attempts?: number;
  firstFailedAt?: string;
  lastFailedAt?: string;
}

// ACH-020 apis-integracoes: optional out-of-process alerting.
// Credentials stay opt-in via env vars; when none are configured the
// processor still enriches the structured log (visible to any log
// aggregator) and continues.
async function fanoutAlert(
  data: DLQJob,
  jobId: string | undefined,
): Promise<void> {
  const slackUrl = process.env.SLACK_WEBHOOK_URL;
  if (slackUrl) {
    try {
      await fetch(slackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `DLQ: ${data.originalQueue} failed job ${data.originalJobId} (tenant=${data.tenantId ?? "?"}, attempts=${data.attempts ?? "?"})\n${data.error.slice(0, 500)}`,
        }),
      });
    } catch (err) {
      // Never let an alert failure flap the processor.
      logger.warn(
        { err: err instanceof Error ? err.message : String(err) },
        "DLQ Slack fanout failed",
      );
    }
  }

  // Sentry's worker `init()` already captures throws; here we issue an
  // explicit `captureMessage` so DLQ entries surface as events even
  // when nothing threw (the original exception is already serialised
  // into `data.error`).
  if (process.env.SENTRY_DSN) {
    try {
      const Sentry = await import("@sentry/node");
      Sentry.captureMessage(`DLQ: ${data.originalQueue}`, {
        level: "warning",
        extra: {
          originalJobId: data.originalJobId,
          dlqJobId: jobId,
          error: data.error,
          tenantId: data.tenantId,
          attempts: data.attempts,
          firstFailedAt: data.firstFailedAt,
          lastFailedAt: data.lastFailedAt,
        },
      });
    } catch {
      // optional dep missing / disabled — log-only path stays fine.
    }
  }
}

async function processDLQJob(job: Job<DLQJob>): Promise<void> {
  // ACH-020 apis-integracoes: structured warn enriched with all fields
  // the scanner collected. Any log aggregator (Grafana Loki, Datadog,
  // CloudWatch) can count `dlq_entries_total` by tenant or by
  // `originalQueue` off this single entry.
  logger.warn(
    {
      jobId: job.id,
      originalQueue: job.data.originalQueue,
      originalJobId: job.data.originalJobId,
      tenantId: job.data.tenantId,
      attempts: job.data.attempts,
      firstFailedAt: job.data.firstFailedAt,
      lastFailedAt: job.data.lastFailedAt,
      error: job.data.error,
    },
    "DLQ entry — see docs/architecture/dlq-replay.md for replay steps",
  );

  // Fire-and-forget fanout; never block ack of the DLQ consumer.
  void fanoutAlert(job.data, job.id);
}

export function startDLQWorker(): Worker<DLQJob> {
  const worker = new Worker("wbc:dlq", processDLQJob, {
    connection,
    concurrency: 1,
  });

  worker.on("completed", (job) => {
    logger.info({ jobId: job.id }, "DLQ job processed");
  });

  return worker;
}
