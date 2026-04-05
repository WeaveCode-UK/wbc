import { initTracing } from './lib/tracing';
import { createLogger } from './lib/logger';
import { initSentry } from './lib/sentry';
import { applyTenantMiddleware } from '@wbc/db';
import { getCurrentTenant, validateEnv } from '@wbc/shared';

// Initialize tracing before anything else
initTracing();

// Validate environment variables
validateEnv('api');

// Initialize Sentry
initSentry();

const logger = createLogger('api');

// Apply tenant middleware
applyTenantMiddleware(() => getCurrentTenant()?.tenantId);

logger.info('WBC API starting...');
logger.info('Sentry initialized');
logger.info('Tenant middleware applied');
logger.info('WBC API module loaded successfully');
