import { logger } from './lib/logger';
import * as Sentry from '@sentry/node';

// Initialize Sentry for worker error tracking
const sentryDsn = process.env.SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  });
  logger.info('Sentry initialized for worker');
}

process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'Unhandled rejection in worker');
  Sentry.captureException(reason);
});

process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught exception in worker');
  Sentry.captureException(error);
  process.exit(1);
});
import { applyTenantMiddleware } from '@wbc/db';
import { getCurrentTenant, setOutboxPort, validateEnv } from '@wbc/shared';

// Validate environment variables
validateEnv('worker');
import { PrismaOutboxRepository } from '@wbc/db';
import { processOutbox } from './processors/outbox-processor';
import { registerInventoryEventHandlers } from '../../../packages/business/inventory/adapters/sale-confirmed-handler';
import { registerPostSaleEventHandler } from '../../../packages/business/messaging/use-cases/post-sale-flow';
import { registerNotificationEventHandlers } from '../../../packages/business/schedule/use-cases/notifications';
import { startMessagingWorker } from './processors/messaging-processor';
import { startCampaignWorker } from './processors/campaign-processor';
import { startScheduleWorker } from './processors/schedule-processor';
import { startAnalyticsWorker } from './processors/analytics-processor';
import { startDLQWorker } from './processors/dlq-processor';
import { cleanupProcessedOutboxEvents } from './processors/outbox-cleanup';
import { scanFailedForDLQ } from './processors/dlq-scanner';
import { subscribe, EVENTS } from '@wbc/shared';

// Apply tenant middleware
applyTenantMiddleware(() => getCurrentTenant()?.tenantId);

// Initialize outbox port
setOutboxPort(new PrismaOutboxRepository());

// Register domain event handlers
registerInventoryEventHandlers();
registerPostSaleEventHandler();
registerNotificationEventHandlers();

logger.info('WBC Worker starting...');
logger.info('Domain event handlers registered');

// Process outbox every 5 seconds
setInterval(async () => {
  try {
    await processOutbox();
  } catch (error) {
    logger.error({ error }, 'Outbox processing failed');
  }
}, 5000);

logger.info('Outbox processor started (5s interval)');

// Start BullMQ workers
startMessagingWorker();
startCampaignWorker();
startScheduleWorker();
startAnalyticsWorker();
startDLQWorker();

logger.info('BullMQ workers started (messaging, campaigns, schedule, analytics, dlq)');
// Cache invalidation handlers
subscribe(EVENTS.TENANT_PLAN_CHANGED, async (event) => {
  const p = event.payload as { tenantId: string };
  try {
    const Redis = (await import('ioredis')).default;
    const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379/0');
    await redis.del(`wbc:entitlements:${p.tenantId}`);
    await redis.quit();
    logger.info({ tenantId: p.tenantId }, 'Entitlements cache invalidated');
  } catch (error) {
    logger.error({ error, tenantId: p.tenantId }, 'Failed to invalidate entitlements cache');
  }
});

// Outbox cleanup: run daily (every 24h)
setInterval(async () => {
  try {
    await cleanupProcessedOutboxEvents();
  } catch (error) {
    logger.error({ error }, 'Outbox cleanup failed');
  }
}, 24 * 60 * 60 * 1000);

logger.info('Outbox cleanup scheduled (24h interval)');

// DLQ scanner: check for permanently failed events every 60s
setInterval(async () => {
  try {
    await scanFailedForDLQ();
  } catch (error) {
    logger.error({ error }, 'DLQ scan failed');
  }
}, 60_000);

logger.info('DLQ scanner scheduled (60s interval)');
logger.info('WBC Worker module loaded successfully');
