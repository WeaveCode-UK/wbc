import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma } from "@wbc/db";
import {
  router,
  protectedProcedure,
  roleProtectedProcedure,
} from "../trpc/trpc";
import { PrismaPlatformRepository } from "@wbc/business/platform/adapters/prisma-platform-repository";
import {
  getReferralCode,
  getOnboarding,
  completeOnboardingStep,
  exportData,
} from "@wbc/business/platform/use-cases/manage-platform";
import {
  getUnlockedFeatures,
  recomputeUnlockedFeatures,
} from "@wbc/business/platform/use-cases/progressive-onboarding";
import { resetDemoTenant } from "@wbc/business/platform/use-cases/demo-mode";

const platformRepo = new PrismaPlatformRepository();

export const platformRouter = router({
  getReferralCode: protectedProcedure.query(async ({ ctx }) => {
    return getReferralCode(ctx.tenant.tenantId, platformRepo);
  }),
  getOnboarding: protectedProcedure.query(async ({ ctx }) => {
    return getOnboarding(ctx.tenant.tenantId, platformRepo);
  }),
  completeStep: protectedProcedure
    .input(z.object({ stepId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return completeOnboardingStep(
        ctx.tenant.tenantId,
        input.stepId,
        platformRepo,
      );
    }),
  exportData: protectedProcedure.query(async ({ ctx }) => {
    return exportData(ctx.tenant.tenantId, platformRepo);
  }),

  // F11.E09: progressive onboarding state. Read by every feature page
  // so it can show "🔒 disponível após X" hints. Recomputed on demand
  // because milestones can move from any mutation path.
  getUnlockedFeatures: protectedProcedure.query(async ({ ctx }) => {
    return getUnlockedFeatures(ctx.tenant.tenantId);
  }),

  refreshUnlockedFeatures: protectedProcedure.mutation(async ({ ctx }) => {
    return recomputeUnlockedFeatures(ctx.tenant.tenantId);
  }),

  // F11.E09: demo mode flag + manual reset. The flag is read by the
  // sidebar to show a DEMO badge; the reset wipes transactional data
  // (clients, sales, expenses, etc.) preserving the workspace shape.
  getTenantBadge: protectedProcedure.query(async ({ ctx }) => {
    const tenant = await prisma.tenant.findUnique({
      where: { id: ctx.tenant.tenantId },
      select: { isDemo: true, demoResetAt: true, name: true },
    });
    return tenant ?? { isDemo: false, demoResetAt: null, name: "" };
  }),

  resetDemo: roleProtectedProcedure("ADMIN").mutation(async ({ ctx }) => {
    try {
      await resetDemoTenant(ctx.tenant.tenantId);
      return { success: true };
    } catch (error) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: error instanceof Error ? error.message : "reset_failed",
      });
    }
  }),
});
