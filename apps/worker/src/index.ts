import { logger } from "./lib/logger";
import * as Sentry from "@sentry/node";

// Initialize Sentry for worker error tracking
const sentryDsn = process.env.SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV ?? "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  });
  logger.info("Sentry initialized for worker");
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
import { applyTenantMiddleware } from "@wbc/db";
import { prisma } from "@wbc/db";
import { getCurrentTenant, setOutboxPort, validateEnv } from "@wbc/shared";

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
import { cleanupProcessedOutboxEvents } from "./processors/outbox-cleanup";
import { scanFailedForDLQ } from "./processors/dlq-scanner";
import { subscribe, EVENTS } from "@wbc/shared";
import { connection as bullmqRedis } from "./lib/redis";
import {
  startWorkerHealthServer,
  DEFAULT_WORKER_HEALTH_PORT,
  DEFAULT_OUTBOX_LAG_THRESHOLD_MS,
} from "./health-server";

// Apply tenant middleware
applyTenantMiddleware(() => getCurrentTenant()?.tenantId);

// Initialize outbox port
setOutboxPort(new PrismaOutboxRepository());

// Register domain event handlers
registerInventoryEventHandlers();
registerPostSaleEventHandler(new PrismaPostSaleFlowRepository());
registerNotificationEventHandlers(new PrismaNotificationRepository());

logger.info("WBC Worker starting...");
logger.info("Domain event handlers registered");

// Process outbox every 5 seconds
const outboxInterval = setInterval(async () => {
  try {
    await processOutbox();
  } catch (error) {
    logger.error({ error }, "Outbox processing failed");
  }
}, 5000);

logger.info("Outbox processor started (5s interval)");

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

// Outbox cleanup: run daily (every 24h)
const cleanupInterval = setInterval(
  async () => {
    try {
      await cleanupProcessedOutboxEvents();
    } catch (error) {
      logger.error({ error }, "Outbox cleanup failed");
    }
  },
  24 * 60 * 60 * 1000,
);

logger.info("Outbox cleanup scheduled (24h interval)");

// DLQ scanner: check for permanently failed events every 60s
const dlqScanInterval = setInterval(async () => {
  try {
    await scanFailedForDLQ();
  } catch (error) {
    logger.error({ error }, "DLQ scan failed");
  }
}, 60_000);

logger.info("DLQ scanner scheduled (60s interval)");

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
  process.env.WORKER_SHUTDOWN_TIMEOUT_MS ?? 30_000,
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
    logger.info("Polling intervals cleared (outbox, cleanup, DLQ scan)");

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
