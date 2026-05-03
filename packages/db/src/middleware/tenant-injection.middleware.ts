import type { Prisma } from "@prisma/client";
import { getCurrentTenantId } from "../tenant-context";

// Models that have a tenantId column and should be filtered by tenant
const TENANT_MODELS = new Set([
  "Client",
  "Tag",
  "ClientTag",
  "ClientWishlist",
  "GiftSuggestor",
  "Product",
  "Showcase",
  "ShowcaseProduct",
  "Sale",
  "SaleItem",
  "Payment",
  "Cashback",
  "Return",
  "Stock",
  "BrandOrder",
  "BrandOrderItem",
  "Sample",
  "Campaign",
  "CampaignRecipient",
  "ScheduledMessage",
  "PostSaleFlow",
  "MessageTemplate",
  "QuickReply",
  "Expense",
  "FinancialReport",
  "Appointment",
  "Reminder",
  "Opportunity",
  "Team",
  "TeamMember",
  "TeamTask",
  "AiGeneration",
  "Delivery",
  "LandingPage",
  "Referral",
  "OnboardingProgress",
  "TenantMember",
  "Invite",
  "Notification",
]);

// Operations that need WHERE tenant_id injection
const READ_OPERATIONS = new Set([
  "findFirst",
  "findMany",
  "findUnique",
  "findFirstOrThrow",
  "findUniqueOrThrow",
  "count",
  "aggregate",
  "groupBy",
]);

const WRITE_OPERATIONS = new Set(["create", "createMany"]);
const UPDATE_DELETE_OPERATIONS = new Set([
  "update",
  "updateMany",
  "delete",
  "deleteMany",
  "upsert",
]);

export function tenantInjectionMiddleware(): Prisma.Middleware {
  return async (params, next) => {
    const tenantId = getCurrentTenantId();

    // If no tenant context, skip injection (admin operations, migrations, seeds)
    if (!tenantId) {
      return next(params);
    }

    const model = params.model;
    if (!model || !TENANT_MODELS.has(model)) {
      return next(params);
    }

    const action = params.action;

    // READ: inject WHERE tenantId
    if (READ_OPERATIONS.has(action)) {
      params.args = params.args || {};
      params.args.where = params.args.where || {};
      params.args.where.tenantId = tenantId;
    }

    // CREATE: inject tenantId in data
    if (WRITE_OPERATIONS.has(action)) {
      params.args = params.args || {};
      if (action === "createMany") {
        if (Array.isArray(params.args.data)) {
          params.args.data = params.args.data.map(
            (d: Record<string, unknown>) => ({
              ...d,
              tenantId,
            }),
          );
        }
      } else {
        params.args.data = params.args.data || {};
        params.args.data.tenantId = tenantId;
      }
    }

    // UPDATE/DELETE: inject WHERE tenantId
    if (UPDATE_DELETE_OPERATIONS.has(action)) {
      params.args = params.args || {};
      params.args.where = params.args.where || {};
      params.args.where.tenantId = tenantId;
    }

    return next(params);
  };
}
