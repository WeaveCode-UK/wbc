import { createLogger } from './lib/logger';
import { applyTenantMiddleware } from '@wbc/db';
import { getCurrentTenant } from '@wbc/shared';

const logger = createLogger('api');

// Apply tenant middleware — uses AsyncLocalStorage context
applyTenantMiddleware(() => getCurrentTenant()?.tenantId);

logger.info('WBC API starting...');
logger.info('Tenant middleware applied');
logger.info('WBC API module loaded successfully');
