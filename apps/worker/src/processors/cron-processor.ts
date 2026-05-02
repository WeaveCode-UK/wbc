import { Worker, Queue, type Job } from "bullmq";
import { prisma } from "@wbc/db";
import { connection } from "../lib/redis";
import { logger } from "../lib/logger";
import { flagInactiveClients } from "@wbc/business/clients/use-cases/flag-inactive-clients";
import { flagExpiringCashbacks } from "@wbc/business/sales/use-cases/flag-expiring-cashback";
import { buildRestockReminders } from "@wbc/business/schedule/use-cases/build-restock-reminders";
import { buildDateReminders } from "@wbc/business/schedule/use-cases/build-date-reminders";
import { recomputeUnlockedFeatures } from "@wbc/business/platform/use-cases/progressive-onboarding";
import {
  resetDemoTenant,
  listDemoTenants,
} from "@wbc/business/platform/use-cases/demo-mode";

// F11.E24: BullMQ scheduler for the six daily/recurring jobs whose
// procedures already exist as manual triggers. Each job runs once per
// active tenant per cron firing — the scheduler enqueues a fan-out
// pseudo-job that lists tenants, then enqueues a per-tenant job for
// each. Per-tenant idempotency lives in the use-case (already true
// for all six).

export const QUEUE_NAME = "wbc:cron";

type CronJob =
  | { kind: "fanout"; type: CronType }
  | { kind: "tenant"; type: CronType; tenantId: string };

type CronType =
  | "flag_inactive_clients"
  | "flag_expiring_cashbacks"
  | "build_restock_reminders"
  | "build_date_reminders"
  | "refresh_unlocked_features"
  | "reset_demo_tenants";

const cronQueue = new Queue<CronJob>(QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    removeOnComplete: 200,
    removeOnFail: 500,
    attempts: 3,
    backoff: { type: "exponential", delay: 30_000 },
  },
});

// Cron expressions are quoted in plain UTC. The worker host should run
// in UTC; tenant-local interpretations live inside the use-cases (they
// already use the tenant's timezone where it matters).
const CRON_SCHEDULES: Record<CronType, string> = {
  flag_inactive_clients: "0 5 * * *", // 05:00 UTC daily
  flag_expiring_cashbacks: "0 6 * * *", // 06:00 UTC daily
  build_restock_reminders: "0 7 * * *", // 07:00 UTC daily
  build_date_reminders: "0 8 * * *", // 08:00 UTC daily
  refresh_unlocked_features: "0 */6 * * *", // every 6h
  reset_demo_tenants: "0 3 * * *", // 03:00 UTC daily — early
};

async function listAllTenants(): Promise<string[]> {
  const rows = await prisma.tenant.findMany({
    where: { isActive: true },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

async function runForTenant(type: CronType, tenantId: string): Promise<void> {
  switch (type) {
    case "flag_inactive_clients":
      await flagInactiveClients(tenantId);
      return;
    case "flag_expiring_cashbacks":
      await flagExpiringCashbacks(tenantId);
      return;
    case "build_restock_reminders":
      await buildRestockReminders(tenantId);
      return;
    case "build_date_reminders":
      await buildDateReminders(tenantId);
      return;
    case "refresh_unlocked_features":
      await recomputeUnlockedFeatures(tenantId);
      return;
    case "reset_demo_tenants":
      await resetDemoTenant(tenantId);
      return;
  }
}

async function processCronJob(job: Job<CronJob>): Promise<void> {
  const { kind, type } = job.data;
  if (kind === "fanout") {
    const tenantIds =
      type === "reset_demo_tenants"
        ? await listDemoTenants()
        : await listAllTenants();
    for (const tenantId of tenantIds) {
      await cronQueue.add(`${type}:${tenantId}`, {
        kind: "tenant",
        type,
        tenantId,
      });
    }
    logger.info({ type, count: tenantIds.length }, "cron fanout queued");
    return;
  }
  await runForTenant(type, job.data.tenantId);
}

export async function registerCronSchedules(): Promise<void> {
  // BullMQ repeatable jobs — `Queue.add` with `{ repeat: { pattern } }`
  // de-duplicates by key, so re-running on worker boot is safe.
  for (const [type, pattern] of Object.entries(CRON_SCHEDULES)) {
    await cronQueue.add(
      `cron:${type}`,
      { kind: "fanout", type: type as CronType },
      {
        repeat: { pattern },
        jobId: `cron:${type}`,
      },
    );
  }
  logger.info(
    { jobs: Object.keys(CRON_SCHEDULES).length },
    "cron schedules registered",
  );
}

export function startCronWorker(): Worker<CronJob> {
  const worker = new Worker<CronJob>(QUEUE_NAME, processCronJob, {
    connection,
    concurrency: 2,
  });

  worker.on("failed", (job, err) => {
    logger.error(
      { jobId: job?.id, type: job?.data.type, error: err.message },
      "cron job failed",
    );
  });

  return worker;
}
