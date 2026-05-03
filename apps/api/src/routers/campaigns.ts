import { z } from "zod";
import { prisma } from "@wbc/db";
import { router, protectedProcedure } from "../trpc/trpc";
import { PrismaCampaignRepository } from "../../../../packages/business/campaigns/adapters/prisma-campaign-repository";
import {
  listCampaigns,
  createCampaign,
  confirmCampaign,
  cancelCampaign,
  getRecipients,
} from "../../../../packages/business/campaigns/use-cases/manage-campaigns";
import { createRemarketingCampaign } from "@wbc/business/campaigns/use-cases/create-remarketing";
import { paginationSchema, uuidSchema } from "@wbc/validators";
import { enqueueJob, getCampaignQueue } from "../lib/queues";
import { idempotentRoute } from "../trpc/idempotency-middleware";
import { listOk } from "../trpc/responses";

const campaignRepo = new PrismaCampaignRepository();

export const campaignsRouter = router({
  list: protectedProcedure
    .input(
      z.object({ ...paginationSchema.shape, status: z.string().optional() }),
    )
    .query(async ({ ctx, input }) => {
      // ACH-007 apis-integracoes: canonical pagination envelope.
      const result = await listCampaigns(
        ctx.tenant.tenantId,
        { status: input.status, page: input.page, limit: input.limit },
        campaignRepo,
      );
      return listOk(result.data, {
        page: input.page,
        limit: input.limit,
        total: result.total,
      });
    }),

  // F11.E26: campaign detail + funnel counts in a single round-trip.
  // Counts come from a single groupBy on CampaignRecipient so the page
  // can render the funnel without N status queries.
  getById: protectedProcedure
    .input(z.object({ id: uuidSchema }))
    .query(async ({ ctx, input }) => {
      const campaign = await campaignRepo.findById(
        ctx.tenant.tenantId,
        input.id,
      );
      if (!campaign) return null;

      const grouped = await prisma.campaignRecipient.groupBy({
        by: ["status"],
        where: { campaignId: input.id },
        _count: { _all: true },
      });
      const counts = {
        pending: 0,
        sent: 0,
        received: 0,
        viewed: 0,
        replied: 0,
        failed: 0,
      };
      for (const row of grouped) {
        const key = row.status.toLowerCase() as keyof typeof counts;
        if (key in counts) counts[key] = row._count._all;
      }
      const total =
        counts.pending +
        counts.sent +
        counts.received +
        counts.viewed +
        counts.replied +
        counts.failed;

      return { campaign, counts, total };
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        message: z.string().min(1),
        audioUrl: z.string().optional(),
        recipientIds: z.array(z.string().uuid()).max(5000),
        scheduledAt: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return createCampaign(ctx.tenant.tenantId, input, campaignRepo);
    }),

  confirm: protectedProcedure
    .input(
      z.object({
        // ACH-001 apis-integracoes: prevents a retry from dispatching the
        // campaign twice. When omitted, middleware derives from input hash.
        idempotencyKey: z.string().min(1).optional(),
        id: uuidSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return idempotentRoute(
        "campaigns.confirm",
        ctx.tenant.tenantId,
        input,
        async () => {
          const campaign = await confirmCampaign(
            ctx.tenant.tenantId,
            input.id,
            campaignRepo,
          );
          // ACH-012: validated enqueue (warn-only) instead of raw Queue.add.
          await enqueueJob(getCampaignQueue(), "send-campaign", {
            tenantId: ctx.tenant.tenantId,
            campaignId: input.id,
          });
          return campaign;
        },
      );
    }),

  cancel: protectedProcedure
    .input(z.object({ id: uuidSchema }))
    .mutation(async ({ ctx, input }) => {
      return cancelCampaign(ctx.tenant.tenantId, input.id, campaignRepo);
    }),

  getRecipients: protectedProcedure
    .input(z.object({ id: uuidSchema, status: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return getRecipients(
        ctx.tenant.tenantId,
        input.id,
        input.status,
        campaignRepo,
      );
    }),

  // F11.E11: clone a campaign filtered to recipients who didn't react.
  // The segment names mirror the funnel chart on /campaigns/[id].
  createRemarketing: protectedProcedure
    .input(
      z.object({
        sourceCampaignId: uuidSchema,
        segment: z.enum(["NO_RECEIVE", "NO_VIEW", "NO_RESPONSE"]),
        newName: z.string().optional(),
        newMessage: z.string().optional(),
        scheduledAt: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return createRemarketingCampaign(
        { tenantId: ctx.tenant.tenantId, ...input },
        campaignRepo,
      );
    }),
});
