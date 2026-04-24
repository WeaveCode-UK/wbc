import { logger } from "./lib/logger";
import * as Sentry from "@sentry/node";
import { redactSentryEvent } from "@wbc/shared";

// ACH-012 observabilidade-operacao: alinhar sampling e aplicar
// beforeSend redactor no worker (antes faltava). `SENTRY_TRACES_SAMPLE_RATE`
// unifica web/api/worker em uma única env var.
const sentryDsn = process.env.SENTRY_DSN;
if (sentryDsn) {
  const sampleRateEnv = Number.parseFloat(
    process.env.SENTRY_TRACES_SAMPLE_RATE ?? "",
  );
  const sampleRate = Number.isFinite(sampleRateEnv)
    ? sampleRateEnv
    : process.env.NODE_ENV === "production"
      ? 0.3
      : 1.0;
  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV ?? "development",
    tracesSampleRate: sampleRate,
    sendDefaultPii: false,
    beforeSend: (event) => redactSentryEvent(event),
    beforeBreadcrumb: (breadcrumb) => redactSentryEvent(breadcrumb),
  });
  Sentry.setTag("service", "worker");
  logger.info({ sampleRate }, "Sentry initialized for worker");
}

process.on("unhandledRejection", (reason) => {
  logger.fatal({ reason }, "Unhandled rejection in worker");
  Sentry.captureException(reason);
});

process.on("uncaughtException", (error) => {
  logger.fatal({ error }, "Uncaught exception in worker");
  Sentry.captureException(error);
  process.exit(1);
});
import { applyTenantMiddleware, createSlowQueryMiddleware } from "@wbc/db";
import { prisma } from "@wbc/db";
import {
  assertOutboxReady,
  getCurrentTenant,
  setOutboxPort,
  validateEnv,
} from "@wbc/shared";

// Validate environment variables
validateEnv("worker");
import { PrismaOutboxRepository } from "@wbc/db";
import { processOutbox } from "./processors/outbox-processor";
import { registerInventoryEventHandlers } from "../../../packages/business/inventory/adapters/sale-confirmed-handler";
import { registerPostSaleEventHandler } from "../../../packages/business/messaging/use-cases/post-sale-flow";
import { registerNotificationEventHandlers } from "../../../packages/business/schedule/use-cases/notifications";
import { PrismaNotificationRepository } from "../../../packages/business/schedule/adapters/prisma-schedule-repository";
import { PrismaPostSaleFlowRepository } from "../../../packages/business/messaging/adapters/prisma-messaging-repository";
import { startMessagingWorker } from "./processors/messaging-processor";
import { startCampaignWorker } from "./processors/campaign-processor";
import { startScheduleWorker } from "./processors/schedule-processor";
import { startAnalyticsWorker } from "./processors/analytics-processor";
import { startDLQWorker } from "./processors/dlq-processor";
import {
  cleanupProcessedOutboxEvents,
  cleanupFailedOutboxEvents,
} from "./processors/outbox-cleanup";
import { scanFailedForDLQ } from "./processors/dlq-scanner";
import {
  archiveDlqEntriesOlderThan,
  reportDlqDepth,
} from "./processors/dlq-archive";
import {
  subscribe,
  EVENTS,
  OUTBOX_POLL_INTERVAL_MS,
  OUTBOX_CLEANUP_INTERVAL_MS,
  DLQ_SCAN_INTERVAL_MS,
  WORKER_SHUTDOWN_TIMEOUT_MS as SHARED_WORKER_SHUTDOWN_TIMEOUT_MS,
} from "@wbc/shared";
import { connection as bullmqRedis } from "./lib/redis";
import {
  startWorkerHealthServer,
  DEFAULT_WORKER_HEALTH_PORT,
  DEFAULT_OUTBOX_LAG_THRESHOLD_MS,
} from "./health-server";

// Apply tenant middleware
applyTenantMiddleware(() => getCurrentTenant()?.tenantId);

// ACH-030 performance-escalabilidade: same slow-query probe the API runs.
prisma.$use(
  createSlowQueryMiddleware({
    thresholdMs: Number(process.env.PRISMA_SLOW_QUERY_MS ?? 500),
    sampleRate: Number(process.env.PRISMA_SLOW_QUERY_SAMPLE ?? 1),
    warn: (fields, msg) => logger.warn(fields, msg),
  }),
);

// Initialize outbox port
setOutboxPort(new PrismaOutboxRepository());
// ACH-017 apis-integracoes: fail fast if the wire above is ever removed
// or regressed — the worker's whole job is publishing / processing events,
// so an unwired outbox is not a recoverable state.
assertOutboxReady();

// Register domain event handlers
registerInventoryEventHandlers();
registerPostSaleEventHandler(new PrismaPostSaleFlowRepository());
registerNotificationEventHandlers(new PrismaNotificationRepository());

logger.info("WBC Worker starting...");
logger.info("Domain event handlers registered");

// Process outbox using the central OUTBOX_POLL_INTERVAL_MS constant (ACH-010).
// ACH-009 performance-escalabilidade: reentrance guard. When a batch
// takes longer than the poll interval, `setInterval` queues a second
// `processOutbox` before the first finishes. Even with SKIP LOCKED
// (ACH-002 dados-persistencia) the two runs still contend for the
// same connection pool slots and double the scheduler pressure —
// better to skip the tick entirely and let lag register.
let isOutboxPolling = false;
const outboxInterval = setInterval(async () => {
  if (isOutboxPolling) {
    logger.warn(
      {},
      "Outbox polling tick skipped — previous run still in progress (ACH-009 perf)",
    );
    return;
  }
  isOutboxPolling = true;
  try {
    await processOutbox();
  } catch (error) {
    logger.error({ error }, "Outbox processing failed");
  } finally {
    isOutboxPolling = false;
  }
}, OUTBOX_POLL_INTERVAL_MS);

logger.info(
  { intervalMs: OUTBOX_POLL_INTERVAL_MS },
  "Outbox processor started",
);

// Start BullMQ workers
const workers = [
  startMessagingWorker(),
  startCampaignWorker(),
  startScheduleWorker(),
  startAnalyticsWorker(),
  startDLQWorker(),
];

logger.info(
  "BullMQ workers started (messaging, campaigns, schedule, analytics, dlq)",
);
// Cache invalidation handlers
subscribe(EVENTS.TENANT_PLAN_CHANGED, async (event) => {
  const p = event.payload as { tenantId: string };
  try {
    const Redis = (await import("ioredis")).default;
    const redis = new Redis(
      process.env.REDIS_URL ?? "redis://localhost:6379/0",
    );
    await redis.del(`wbc:entitlements:${p.tenantId}`);
    await redis.quit();
    logger.info({ tenantId: p.tenantId }, "Entitlements cache invalidated");
  } catch (error) {
    logger.error(
      { error, tenantId: p.tenantId },
      "Failed to invalidate entitlements cache",
    );
  }
});

// Outbox cleanup: interval from shared constants (ACH-010).
// ACH-007 custos-finops: também purga FAILED com retries esgotados.
const cleanupInterval = setInterval(async () => {
  try {
    await cleanupProcessedOutboxEvents();
    await cleanupFailedOutboxEvents();
  } catch (error) {
    logger.error({ error }, "Outbox cleanup failed");
  }
}, OUTBOX_CLEANUP_INTERVAL_MS);

logger.info(
  { intervalMs: OUTBOX_CLEANUP_INTERVAL_MS },
  "Outbox cleanup scheduled",
);

// DLQ scanner interval from shared constants (ACH-010).
const dlqScanInterval = setInterval(async () => {
  try {
    await scanFailedForDLQ();
  } catch (error) {
    logger.error({ error }, "DLQ scan failed");
  }
}, DLQ_SCAN_INTERVAL_MS);

logger.info({ intervalMs: DLQ_SCAN_INTERVAL_MS }, "DLQ scanner scheduled");

// ACH-017 dados-persistencia: periodic archive of expired DLQ rows +
// depth alert. Runs on the same cadence as the scanner; kept separate
// so each loop has a single responsibility and a single failure mode.
const dlqArchiveInterval = setInterval(async () => {
  try {
    await archiveDlqEntriesOlderThan(
      Number(process.env.DLQ_ARCHIVE_DAYS ?? 90),
    );
  } catch (error) {
    logger.error({ error }, "DLQ archive failed");
  }
  try {
    await reportDlqDepth(Number(process.env.DLQ_DEPTH_THRESHOLD ?? 100));
  } catch (error) {
    logger.error({ error }, "DLQ depth probe failed");
  }
}, DLQ_SCAN_INTERVAL_MS);

logger.info("DLQ archive + depth probe scheduled (ACH-017 dados-persistencia)");

// Health server (ACH-011): expoe /health/live e /health/ready na porta dedicada
// para orchestrators (Docker/Kubernetes) detectarem falhas e lag do worker.
const healthHandles = startWorkerHealthServer({
  port: Number(process.env.WORKER_HEALTH_PORT ?? DEFAULT_WORKER_HEALTH_PORT),
  workers,
  outboxLagThresholdMs: Number(
    process.env.OUTBOX_READY_LAG_THRESHOLD_MS ??
      DEFAULT_OUTBOX_LAG_THRESHOLD_MS,
  ),
});

logger.info("WBC Worker module loaded successfully");

// Graceful shutdown
// On SIGTERM/SIGINT: stop accepting new jobs, cancel timers, drain in-flight
// jobs, close BullMQ workers, disconnect Redis and Prisma, then exit.
// Honors the at-least-once guarantee declared in ADR-003 (outbox + BullMQ).
const SHUTDOWN_TIMEOUT_MS = Number(
  process.env.WORKER_SHUTDOWN_TIMEOUT_MS ?? SHARED_WORKER_SHUTDOWN_TIMEOUT_MS,
);
let shuttingDown = false;

async function gracefulShutdown(signal: NodeJS.Signals): Promise<void> {
  if (shuttingDown) {
    logger.warn(
      { signal },
      "Shutdown already in progress, ignoring additional signal",
    );
    return;
  }
  shuttingDown = true;

  logger.info(
    { signal, timeout_ms: SHUTDOWN_TIMEOUT_MS },
    "Graceful shutdown requested",
  );

  const forceExit = setTimeout(() => {
    logger.fatal(
      { signal, timeout_ms: SHUTDOWN_TIMEOUT_MS },
      "Graceful shutdown exceeded timeout; forcing exit(1)",
    );
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  try {
    clearInterval(outboxInterval);
    clearInterval(cleanupInterval);
    clearInterval(dlqScanInterval);
    clearInterval(dlqArchiveInterval);
    logger.info(
      "Polling intervals cleared (outbox, cleanup, DLQ scan, DLQ archive)",
    );

    await healthHandles.stop();
    logger.info("Worker health server stopped");

    // Pause stops consumption of new jobs; pass true to wait for in-flight
    // jobs to finish their current iteration.
    await Promise.all(workers.map((w) => w.pause(true)));
    logger.info("BullMQ workers paused (in-flight jobs drained)");

    await Promise.all(workers.map((w) => w.close()));
    logger.info("BullMQ workers closed");

    await bullmqRedis.quit();
    logger.info("Redis connection closed");

    await prisma.$disconnect();
    logger.info("Prisma disconnected");

    logger.info({ signal }, "Graceful shutdown complete");
    clearTimeout(forceExit);
    process.exit(0);
  } catch (error) {
    logger.fatal({ error, signal }, "Error during graceful shutdown");
    Sentry.captureException(error);
    clearTimeout(forceExit);
    process.exit(1);
  }
}

process.on("SIGTERM", () => {
  void gracefulShutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void gracefulShutdown("SIGINT");
});

logger.info("Graceful shutdown handlers registered (SIGTERM, SIGINT)");

/**
 * ACH-013 codigo-manutenibilidade: module-top initialisation means
 * importing any symbol from here fires Sentry, the tenant middleware,
 * Redis and the BullMQ workers. This placeholder gives the caller a single
 * async boundary to hook on to. The full refactor (moving top-level
 * side-effects into the body of `bootstrap()` and gating execution with
 * an `isEntryPoint()` check) is intentionally deferred — it's a large,
 * risky diff that doesn't fit a maintenance audit PR. Tracked as
 * follow-up to ACH-013.
 */
export async function bootstrap(): Promise<void> {
  logger.info("bootstrap() invoked (current: reuses module-level init)");
}
