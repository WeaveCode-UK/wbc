import { z } from 'zod';
import { router, protectedProcedure } from '../trpc/trpc';
import { PrismaCampaignRepository } from '../../../../packages/business/campaigns/adapters/prisma-campaign-repository';
import { listCampaigns, createCampaign, confirmCampaign, cancelCampaign, getRecipients } from '../../../../packages/business/campaigns/use-cases/manage-campaigns';
import { paginationSchema, uuidSchema } from '@wbc/validators';

const campaignRepo = new PrismaCampaignRepository();

export const campaignsRouter = router({
  list: protectedProcedure
    .input(z.object({ ...paginationSchema.shape, status: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return listCampaigns(ctx.tenant.tenantId, { status: input.status, page: input.page, limit: input.limit }, campaignRepo);
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      message: z.string().min(1),
      audioUrl: z.string().optional(),
      recipientIds: z.array(z.string().uuid()),
      scheduledAt: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return createCampaign(ctx.tenant.tenantId, input, campaignRepo);
    }),

  confirm: protectedProcedure
    .input(z.object({ id: uuidSchema }))
    .mutation(async ({ ctx, input }) => {
      return confirmCampaign(ctx.tenant.tenantId, input.id, campaignRepo);
    }),

  cancel: protectedProcedure
    .input(z.object({ id: uuidSchema }))
    .mutation(async ({ ctx, input }) => {
      return cancelCampaign(ctx.tenant.tenantId, input.id, campaignRepo);
    }),

  getRecipients: protectedProcedure
    .input(z.object({ id: uuidSchema, status: z.string().optional() }))
    .query(async ({ input }) => {
      return getRecipients(input.id, input.status, campaignRepo);
    }),
});
