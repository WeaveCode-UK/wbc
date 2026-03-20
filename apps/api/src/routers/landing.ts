import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../trpc/trpc';
import { getLandingPage, updateLandingPage, toggleLandingActive, getPublicLandingPage } from '../../../../packages/business/landing/use-cases/manage-landing';

export const landingRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => { return getLandingPage(ctx.tenant.tenantId); }),
  update: protectedProcedure
    .input(z.object({ bio: z.string().optional(), philosophy: z.string().optional(), photoUrl: z.string().optional(), whatsappLink: z.string().optional() }))
    .mutation(async ({ ctx, input }) => { return updateLandingPage(ctx.tenant.tenantId, input); }),
  toggleActive: protectedProcedure
    .input(z.object({ isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => { return toggleLandingActive(ctx.tenant.tenantId, input.isActive); }),
  getPublic: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => { return getPublicLandingPage(input.slug); }),
});
