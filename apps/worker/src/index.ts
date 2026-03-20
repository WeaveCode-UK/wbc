import { logger } from './lib/logger';
import { applyTenantMiddleware } from '@wbc/db';
import { getCurrentTenant, setOutboxPort } from '@wbc/shared';
import { PrismaOutboxRepository } from '@wbc/db';
import { processOutbox } from './processors/outbox-processor';

// Apply tenant middleware
applyTenantMiddleware(() => getCurrentTenant()?.tenantId);

// Initialize outbox port
setOutboxPort(new PrismaOutboxRepository());

logger.info('WBC Worker starting...');

// Process outbox every 5 seconds
setInterval(async () => {
  try {
    await processOutbox();
  } catch (error) {
    logger.error({ error }, 'Outbox processing failed');
  }
}, 5000);

logger.info('Outbox processor started (5s interval)');
logger.info('WBC Worker module loaded successfully');
