import { router, protectedProcedure } from "../trpc/trpc";
import { PrismaAnalyticsRepository } from "../../../../packages/business/analytics/adapters/prisma-analytics-repository";
import { getAnalyticsDashboard } from "../../../../packages/business/analytics/use-cases/get-dashboard";
import {
  getSalesStats,
  getProductRanking,
  getClientEngagement,
} from "../../../../packages/business/analytics/use-cases/get-stats";
// ACH-008 apis-integracoes: schemas centralised in @wbc/validators.
import {
  getClientEngagementSchema,
  getProductRankingSchema,
  getSalesStatsSchema,
} from "@wbc/validators";
import { cacheGet, cacheSet } from "../lib/cache";
import { enqueueJob, getAnalyticsQueue } from "../lib/queues";

const analyticsRepo = new PrismaAnalyticsRepository();

export const analyticsRouter = router({
  getDashboard: protectedProcedure.query(async ({ ctx }) => {
    const cacheKey = `analytics:dashboard:${ctx.tenant.tenantId}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;
    const result = await getAnalyticsDashboard(
      ctx.tenant.tenantId,
      analyticsRepo,
    );
    await cacheSet(cacheKey, result, 300);
    return result;
  }),

  getSalesStats: protectedProcedure
    .input(getSalesStatsSchema)
    .query(async ({ ctx, input }) => {
      const cacheKey = `analytics:sales:${ctx.tenant.tenantId}:${input.period ?? "current"}`;
      const cached = await cacheGet(cacheKey);
      if (cached) return cached;
      const result = await getSalesStats(
        ctx.tenant.tenantId,
        input.period,
        analyticsRepo,
      );
      await cacheSet(cacheKey, result, 180);
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

  recalculateABC: protectedProcedure.mutation(async ({ ctx }) => {
    // ACH-012: validated enqueue (warn-only) instead of raw Queue.add.
    await enqueueJob(getAnalyticsQueue(), "recalculate-abc", {
      tenantId: ctx.tenant.tenantId,
    });
    return { queued: true };
  }),
});
