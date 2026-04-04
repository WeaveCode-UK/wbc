import { logger } from './lib/logger';
import { applyTenantMiddleware } from '@wbc/db';
import { getCurrentTenant, setOutboxPort } from '@wbc/shared';
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
logger.info('WBC Worker module loaded successfully');
