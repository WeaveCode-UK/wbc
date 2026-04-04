import { z } from 'zod';
import { router, protectedProcedure } from '../trpc/trpc';
import { DeepSeekAdapter } from '../../../../packages/business/ai/adapters/deepseek-adapter';
import { PrismaAIRepository } from '../../../../packages/business/ai/adapters/prisma-ai-repository';
import { generateCampaignText, generateBillingMessage, generateReactivation, correctText, getAIUsage } from '../../../../packages/business/ai/use-cases/generate-text';

const aiProvider = new DeepSeekAdapter();
const aiRepo = new PrismaAIRepository();

export const aiRouter = router({
  generateCampaignText: protectedProcedure
    .input(z.object({ objective: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return generateCampaignText(ctx.tenant.tenantId, input.objective, aiProvider, aiRepo);
    }),

  generateBillingMessage: protectedProcedure
    .input(z.object({ clientName: z.string(), amount: z.number(), dueDate: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return generateBillingMessage(ctx.tenant.tenantId, input.clientName, input.amount, input.dueDate, aiProvider, aiRepo);
    }),

  generateReactivation: protectedProcedure
    .input(z.object({ clientName: z.string(), lastPurchaseDate: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return generateReactivation(ctx.tenant.tenantId, input.clientName, input.lastPurchaseDate, aiProvider, aiRepo);
    }),

  correctText: protectedProcedure
    .input(z.object({ text: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return correctText(ctx.tenant.tenantId, input.text, aiProvider, aiRepo);
    }),

  getUsage: protectedProcedure.query(async ({ ctx }) => {
    return getAIUsage(ctx.tenant.tenantId, aiRepo);
  }),
});
