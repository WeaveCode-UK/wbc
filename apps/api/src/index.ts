import { createLogger } from './lib/logger';
import { initSentry } from './lib/sentry';
import { applyTenantMiddleware } from '@wbc/db';
import { getCurrentTenant } from '@wbc/shared';

// Initialize Sentry first
initSentry();

const logger = createLogger('api');

// Apply tenant middleware
applyTenantMiddleware(() => getCurrentTenant()?.tenantId);

logger.info('WBC API starting...');
logger.info('Sentry initialized');
logger.info('Tenant middleware applied');
logger.info('WBC API module loaded successfully');
