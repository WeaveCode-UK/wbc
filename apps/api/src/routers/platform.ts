import { z } from 'zod';
import { router, protectedProcedure } from '../trpc/trpc';
import { PrismaPlatformRepository } from '../../../../packages/business/platform/adapters/prisma-platform-repository';
import { getReferralCode, getOnboarding, completeOnboardingStep, exportData } from '../../../../packages/business/platform/use-cases/manage-platform';

const platformRepo = new PrismaPlatformRepository();

export const platformRouter = router({
  getReferralCode: protectedProcedure.query(async ({ ctx }) => { return getReferralCode(ctx.tenant.tenantId, platformRepo); }),
  getOnboarding: protectedProcedure.query(async ({ ctx }) => { return getOnboarding(ctx.tenant.tenantId, platformRepo); }),
  completeStep: protectedProcedure
    .input(z.object({ stepId: z.string() }))
    .mutation(async ({ ctx, input }) => { return completeOnboardingStep(ctx.tenant.tenantId, input.stepId, platformRepo); }),
  exportData: protectedProcedure.query(async ({ ctx }) => { return exportData(ctx.tenant.tenantId, platformRepo); }),
});
