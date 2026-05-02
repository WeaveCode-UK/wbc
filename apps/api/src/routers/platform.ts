import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma } from "@wbc/db";
import {
  router,
  protectedProcedure,
  publicProcedure,
  roleProtectedProcedure,
} from "../trpc/trpc";
import { uuidSchema } from "@wbc/validators";
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
import {
  createNpsSurvey,
  getNpsByToken,
  getNpsStats,
  listNpsResponses,
  recordNpsResponse,
} from "@wbc/business/platform/use-cases/manage-nps";
import {
  generatePromoCardSvg,
  svgToDataUrl,
  type PromoTemplate,
} from "@wbc/business/platform/use-cases/generate-promo-card";

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

  // F11.E10: NPS post-delivery survey. Creation lives behind auth (the
  // consultora kicks one off manually before the DELIVERY_COMPLETED
  // outbox handler is wired); response is public so the consumer can
  // fill the form without logging in.
  createNps: protectedProcedure
    .input(z.object({ clientId: uuidSchema, saleId: uuidSchema.optional() }))
    .mutation(async ({ ctx, input }) => {
      return createNpsSurvey({
        tenantId: ctx.tenant.tenantId,
        clientId: input.clientId,
        saleId: input.saleId ?? null,
      });
    }),

  npsStats: protectedProcedure.query(async ({ ctx }) => {
    return getNpsStats(ctx.tenant.tenantId);
  }),

  npsList: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(500).default(100) }))
    .query(async ({ ctx, input }) => {
      return listNpsResponses(ctx.tenant.tenantId, input.limit);
    }),

  npsLookup: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .query(async ({ input }) => {
      return getNpsByToken(input.token);
    }),

  npsRespond: publicProcedure
    .input(
      z.object({
        token: z.string().min(1),
        score: z.number().int().min(0).max(10),
        comment: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      return recordNpsResponse(input);
    }),

  // F11.E10: promotional card generator. Returns SVG inline + data URL
  // so the UI can preview, copy and save without a CDN. PNG render via
  // sharp + bucket upload is queued as follow-up.
  generatePromoCard: protectedProcedure
    .input(
      z.object({
        template: z.enum(["minimal", "bold", "festive", "elegant"]),
        title: z.string().min(1).max(80),
        price: z.number().positive().optional(),
        brand: z.string().optional(),
        callToAction: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const svg = generatePromoCardSvg({
        ...input,
        template: input.template as PromoTemplate,
      });
      return { svg, dataUrl: svgToDataUrl(svg) };
    }),
});
