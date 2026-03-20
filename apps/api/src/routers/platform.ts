import { z } from 'zod';
import { router, protectedProcedure } from '../trpc/trpc';
import { getReferralCode, getOnboarding, completeOnboardingStep, exportData } from '../../../../packages/business/platform/use-cases/manage-platform';

export const platformRouter = router({
  getReferralCode: protectedProcedure.query(async ({ ctx }) => { return getReferralCode(ctx.tenant.tenantId); }),
  getOnboarding: protectedProcedure.query(async ({ ctx }) => { return getOnboarding(ctx.tenant.tenantId); }),
  completeStep: protectedProcedure
    .input(z.object({ stepId: z.string() }))
    .mutation(async ({ ctx, input }) => { return completeOnboardingStep(ctx.tenant.tenantId, input.stepId); }),
  exportData: protectedProcedure.query(async ({ ctx }) => { return exportData(ctx.tenant.tenantId); }),
});
