import { z } from 'zod';
import { router, protectedProcedure } from '../trpc/trpc';
import { PrismaAnalyticsRepository } from '../../../../packages/business/analytics/adapters/prisma-analytics-repository';
import { getAnalyticsDashboard } from '../../../../packages/business/analytics/use-cases/get-dashboard';
import { getSalesStats, getProductRanking, getClientEngagement, calculateABCClassification } from '../../../../packages/business/analytics/use-cases/get-stats';
import { uuidSchema } from '@wbc/validators';

const analyticsRepo = new PrismaAnalyticsRepository();

export const analyticsRouter = router({
  getDashboard: protectedProcedure.query(async ({ ctx }) => {
    return getAnalyticsDashboard(ctx.tenant.tenantId, analyticsRepo);
  }),

  getSalesStats: protectedProcedure
    .input(z.object({ period: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return getSalesStats(ctx.tenant.tenantId, input.period, analyticsRepo);
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
    return calculateABCClassification(ctx.tenant.tenantId, analyticsRepo);
  }),
});
