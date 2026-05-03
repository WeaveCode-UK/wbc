import { router, protectedProcedure } from "../trpc/trpc";
import { PrismaAnalyticsRepository } from "../../../../packages/business/analytics/adapters/prisma-analytics-repository";
import { getAnalyticsDashboard } from "../../../../packages/business/analytics/use-cases/get-dashboard";
import {
  getSalesStats,
  getProductRanking,
  getClientEngagement,
} from "../../../../packages/business/analytics/use-cases/get-stats";
import { getSeasonality } from "../../../../packages/business/analytics/use-cases/get-seasonality";
// ACH-008 apis-integracoes: schemas centralised in @wbc/validators.
import {
  getClientEngagementSchema,
  getProductRankingSchema,
  getSalesStatsSchema,
  getSeasonalitySchema,
} from "@wbc/validators";
// ACH-015: tenant-scoped cache helpers prefix the key automatically and
// throw TenantContextMissingError if invoked outside a runWithTenant
// context — refactor-safe replacement for the raw cacheGet/cacheSet pair.
import { cacheGetForTenant, cacheSetForTenant } from "../lib/cache";
import { enqueueJob, getAnalyticsQueue } from "../lib/queues";

const analyticsRepo = new PrismaAnalyticsRepository();

export const analyticsRouter = router({
  getDashboard: protectedProcedure.query(async ({ ctx }) => {
    // ACH-015: tenant prefix is now derived inside getTenantScopedRedis()
    // from the AsyncLocalStorage context — the explicit `:${tenantId}`
    // suffix is no longer needed (and would double-scope the key).
    // F11.E03: explicit Awaited<ReturnType<...>> on cacheGetForTenant so
    // the inferred procedure output preserves DashboardData; without it
    // the cache hit path collapsed to `{}` and broke web typing.
    type Output = Awaited<ReturnType<typeof getAnalyticsDashboard>>;
    const cacheKey = "analytics:dashboard";
    const cached = await cacheGetForTenant<Output>(cacheKey);
    if (cached) return cached;
    const result = await getAnalyticsDashboard(
      ctx.tenant.tenantId,
      analyticsRepo,
    );
    await cacheSetForTenant(cacheKey, result, 300);
    return result;
  }),

  getSalesStats: protectedProcedure
    .input(getSalesStatsSchema)
    .query(async ({ ctx, input }) => {
      const cacheKey = `analytics:sales:${input.period ?? "current"}`;
      const cached = await cacheGetForTenant(cacheKey);
      if (cached) return cached;
      const result = await getSalesStats(
        ctx.tenant.tenantId,
        input.period,
        analyticsRepo,
      );
      await cacheSetForTenant(cacheKey, result, 180);
      return result;
    }),

  getProductRanking: protectedProcedure
    .input(getProductRankingSchema)
    .query(async ({ ctx, input }) => {
      return getProductRanking(ctx.tenant.tenantId, input.limit, analyticsRepo);
    }),

  getClientEngagement: protectedProcedure
    .input(getClientEngagementSchema)
    .query(async ({ ctx, input }) => {
      return getClientEngagement(
        ctx.tenant.tenantId,
        input.clientId,
        analyticsRepo,
      );
    }),

  getSeasonality: protectedProcedure
    .input(getSeasonalitySchema)
    .query(async ({ ctx, input }) => {
      const cacheKey = `analytics:seasonality:${input.monthsBack}`;
      type Output = Awaited<ReturnType<typeof getSeasonality>>;
      const cached = await cacheGetForTenant<Output>(cacheKey);
      if (cached) return cached;
      const result = await getSeasonality(
        ctx.tenant.tenantId,
        input.monthsBack,
        analyticsRepo,
      );
      await cacheSetForTenant(cacheKey, result, 600);
      return result;
    }),

  recalculateABC: protectedProcedure.mutation(async ({ ctx }) => {
    // ACH-012: validated enqueue (warn-only) instead of raw Queue.add.
    await enqueueJob(getAnalyticsQueue(), "recalculate-abc", {
      tenantId: ctx.tenant.tenantId,
    });
    return { queued: true };
  }),
});
