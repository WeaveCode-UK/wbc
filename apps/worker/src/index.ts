import { logger } from './lib/logger';
import { applyTenantMiddleware } from '@wbc/db';
import { getCurrentTenant } from '@wbc/shared';

// Apply tenant middleware — workers use withTenant() to set context
applyTenantMiddleware(() => getCurrentTenant()?.tenantId);

logger.info('WBC Worker starting...');
logger.info('Tenant middleware applied');
logger.info('WBC Worker module loaded successfully');
