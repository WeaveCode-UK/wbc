import type { Prisma } from '@prisma/client';
import { logSecurityEvent } from '@wbc/shared';

// Tables that require tenantId filtering
const TENANT_SCOPED_MODELS = new Set([
  'Client', 'Tag', 'Product', 'Showcase', 'Sale', 'Cashback',
  'Stock', 'BrandOrder', 'Sample', 'Campaign', 'ScheduledMessage',
  'MessageTemplate', 'QuickReply', 'Expense', 'FinancialReport',
  'Appointment', 'Reminder', 'Opportunity', 'AIGeneration',
  'Notification', 'LandingPage', 'Team', 'Invite',
  'OnboardingProgress', 'ClientWishlist', 'GiftSuggestor',
]);

export function createTenantMiddleware(
  getTenantId: () => string | undefined,
): Prisma.Middleware {
  return async (params, next) => {
    const model = params.model;

    if (!model || !TENANT_SCOPED_MODELS.has(model)) {
      return next(params);
    }

    const tenantId = getTenantId();

    if (!tenantId) {
      logSecurityEvent({
        event: 'tenant.cross_tenant_blocked',
        success: false,
        detail: `${model}.${params.action} without tenantId`,
      });
      throw new Error(`Tenant context required for ${model}.${params.action} but tenantId is undefined`);
    }

    // Inject tenantId into WHERE clauses for read operations
    if (['findMany', 'findFirst', 'findUnique', 'count', 'aggregate', 'groupBy'].includes(params.action)) {
      if (!params.args) params.args = {};
      if (!params.args.where) params.args.where = {};
      params.args.where.tenantId = tenantId;
    }

    // Inject tenantId into CREATE data
    if (['create', 'createMany'].includes(params.action)) {
      if (!params.args) params.args = {};
      if (params.action === 'create' && params.args.data) {
        params.args.data.tenantId = tenantId;
      }
      if (params.action === 'createMany' && params.args.data) {
        if (Array.isArray(params.args.data)) {
          params.args.data = params.args.data.map((d: Record<string, unknown>) => ({
            ...d,
            tenantId,
          }));
        }
      }
    }

    // Inject tenantId into UPDATE/DELETE WHERE
    if (['update', 'updateMany', 'delete', 'deleteMany'].includes(params.action)) {
      if (!params.args) params.args = {};
      if (!params.args.where) params.args.where = {};
      params.args.where.tenantId = tenantId;
    }

    return next(params);
  };
}
