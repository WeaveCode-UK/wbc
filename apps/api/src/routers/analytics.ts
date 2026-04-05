import { z } from 'zod';
import { router, protectedProcedure } from '../trpc/trpc';
import { PrismaAnalyticsRepository } from '../../../../packages/business/analytics/adapters/prisma-analytics-repository';
import { getAnalyticsDashboard } from '../../../../packages/business/analytics/use-cases/get-dashboard';
import { getSalesStats, getProductRanking, getClientEngagement } from '../../../../packages/business/analytics/use-cases/get-stats';
import { uuidSchema } from '@wbc/validators';
import { cacheGet, cacheSet } from '../lib/cache';
import { getAnalyticsQueue } from '../lib/queues';

const analyticsRepo = new PrismaAnalyticsRepository();

export const analyticsRouter = router({
  getDashboard: protectedProcedure.query(async ({ ctx }) => {
    const cacheKey = `analytics:dashboard:${ctx.tenant.tenantId}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;
    const result = await getAnalyticsDashboard(ctx.tenant.tenantId, analyticsRepo);
    await cacheSet(cacheKey, result, 300);
    return result;
  }),

  getSalesStats: protectedProcedure
    .input(z.object({ period: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const cacheKey = `analytics:sales:${ctx.tenant.tenantId}:${input.period ?? 'current'}`;
      const cached = await cacheGet(cacheKey);
      if (cached) return cached;
      const result = await getSalesStats(ctx.tenant.tenantId, input.period, analyticsRepo);
      await cacheSet(cacheKey, result, 180);
      return result;
    }),

  getProductRanking: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(10) }))
    .query(async ({ ctx, input }) => {
      return getProductRanking(ctx.tenant.tenantId, input.limit, analyticsRepo);
    }),

  getClientEngagement: protectedProcedure
    .input(z.object({ clientId: uuidSchema }))
    .query(async ({ ctx, input }) => {
      return getClientEngagement(ctx.tenant.tenantId, input.clientId, analyticsRepo);
    }),

  recalculateABC: protectedProcedure.mutation(async ({ ctx }) => {
    await getAnalyticsQueue().add('recalculate-abc', { tenantId: ctx.tenant.tenantId });
    return { queued: true };
  }),
});
