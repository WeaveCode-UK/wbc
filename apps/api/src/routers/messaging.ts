import { router, protectedProcedure } from "../trpc/trpc";
import {
  idempotentRoute,
  resolveIdempotencyKey,
} from "../trpc/idempotency-middleware";
import { WhatsAppN1Adapter } from "../../../../packages/business/messaging/adapters/whatsapp-n1-adapter";
import { WhatsAppN2Adapter } from "../../../../packages/business/messaging/adapters/whatsapp-n2-adapter";
import { PrismaClientRepository } from "../../../../packages/business/clients/adapters/prisma-client-repository";
import { personalizeMessage } from "../../../../packages/business/messaging/domain/whatsapp";
import { generateWhatsappLink } from "@wbc/business/messaging/use-cases/generate-whatsapp-link";
import type { WhatsAppPort } from "../../../../packages/business/messaging/ports/whatsapp-port";
import { z } from "zod";
import { prisma } from "@wbc/db";
import { uuidSchema } from "@wbc/validators";
// ACH-008 apis-integracoes: schema centralised in @wbc/validators.
import { sendToClientSchema } from "@wbc/validators";
import { PrismaQuickReplyRepository } from "@wbc/business/messaging/adapters/prisma-messaging-repository";
import {
  listQuickReplies,
  createQuickReply,
  deleteQuickReply,
} from "@wbc/business/messaging/use-cases/quick-replies";
import { PrismaTemplateRepository } from "@wbc/business/campaigns/adapters/prisma-template-repository";
import {
  listTemplates,
  createTemplate,
  deleteTemplate,
  listCommunityTemplates,
  shareToFeed,
} from "@wbc/business/campaigns/use-cases/manage-templates";

const whatsappN1 = new WhatsAppN1Adapter();
const whatsappN2 = new WhatsAppN2Adapter();
const clientRepo = new PrismaClientRepository();
const quickReplyRepo = new PrismaQuickReplyRepository();
const templateRepo = new PrismaTemplateRepository();

function getWhatsAppAdapter(plan: string): WhatsAppPort {
  return plan === "PRO" ? whatsappN2 : whatsappN1;
}

export const messagingRouter = router({
  sendToClient: protectedProcedure
    // ACH-001 apis-integracoes: schema already carries optional
    // idempotencyKey; see @wbc/validators/messaging.
    .input(sendToClientSchema)
    .mutation(async ({ ctx, input }) => {
      return idempotentRoute(
        "messaging.sendToClient",
        ctx.tenant.tenantId,
        input,
        async () => {
          const client = await clientRepo.findById(
            ctx.tenant.tenantId,
            input.clientId,
          );
          if (!client) {
            return {
              success: false,
              whatsappLink: undefined,
              messageId: undefined,
            };
          }

          const personalizedMessage = personalizeMessage(
            input.message,
            client.name,
          );
          const adapter = getWhatsAppAdapter(ctx.tenant.plan);
          // ACH-016 apis-integracoes: forward the idempotency key down to
          // the WhatsApp adapter so Meta sees the same X-Request-Id on a
          // retry (coalesced upstream).
          const outboundKey = resolveIdempotencyKey(
            "messaging.sendToClient",
            ctx.tenant.tenantId,
            input,
          );

          if (input.audioUrl) {
            return adapter.sendAudio(client.phone, input.audioUrl, {
              idempotencyKey: outboundKey,
            });
          }
          return adapter.sendText(client.phone, personalizedMessage, {
            idempotencyKey: outboundKey,
          });
        },
      );
    }),

  getConnectionStatus: protectedProcedure.query(async ({ ctx }) => {
    const isN2Available =
      ctx.tenant.plan === "PRO" && Boolean(process.env.WHATSAPP_API_TOKEN);
    return { connected: isN2Available, plan: ctx.tenant.plan };
  }),

  // F11.E14: quick replies CRUD.
  listQuickReplies: protectedProcedure.query(async ({ ctx }) => {
    return listQuickReplies(ctx.tenant.tenantId, quickReplyRepo);
  }),
  createQuickReply: protectedProcedure
    .input(
      z.object({
        label: z.string().min(1).max(80),
        text: z.string().min(1).max(2000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return createQuickReply(
        ctx.tenant.tenantId,
        input.label,
        input.text,
        quickReplyRepo,
      );
    }),
  deleteQuickReply: protectedProcedure
    .input(z.object({ id: uuidSchema }))
    .mutation(async ({ ctx, input }) => {
      return deleteQuickReply(ctx.tenant.tenantId, input.id, quickReplyRepo);
    }),

  // F11.E14: message templates (personal + system) and community feed.
  listTemplates: protectedProcedure
    .input(z.object({ category: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return listTemplates(ctx.tenant.tenantId, input.category, templateRepo);
    }),
  createTemplate: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(80),
        category: z.string(),
        text: z.string().min(1).max(2000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return createTemplate(
        ctx.tenant.tenantId,
        input.name,
        input.category,
        input.text,
        templateRepo,
      );
    }),
  deleteTemplate: protectedProcedure
    .input(z.object({ id: uuidSchema }))
    .mutation(async ({ ctx, input }) => {
      return deleteTemplate(ctx.tenant.tenantId, input.id, templateRepo);
    }),
  listCommunityTemplates: protectedProcedure
    .input(
      z.object({
        topic: z.string().optional(),
        sort: z.string().optional(),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
      }),
    )
    .query(async ({ input }) => {
      return listCommunityTemplates(input, templateRepo);
    }),
  shareToFeed: protectedProcedure
    .input(z.object({ text: z.string().min(1), topic: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      return shareToFeed(
        ctx.tenant.tenantId,
        input.text,
        input.topic,
        templateRepo,
      );
    }),

  // F11.E11: build a wa.me deep link for a given client and intent.
  // The procedure resolves the client phone server-side so the UI
  // doesn't have to embed phone numbers in URLs.
  generateLink: protectedProcedure
    .input(
      z.object({
        clientId: uuidSchema,
        kind: z.enum([
          "GENERIC",
          "SALE_CONFIRMED",
          "PAYMENT_REMINDER",
          "REPOSITION_REMINDER",
          "BIRTHDAY",
          "DELIVERY_DISPATCHED",
          "REACTIVATION",
        ]),
        customMessage: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const client = await clientRepo.findById(
        ctx.tenant.tenantId,
        input.clientId,
      );
      if (!client) throw new Error("Client not found");
      return generateWhatsappLink({
        phone: client.phone,
        clientName: client.name,
        kind: input.kind,
        customMessage: input.customMessage,
      });
    }),

  // F11 follow-up: post-sale 2+2+2 cadence config (read+write). The
  // page in /messaging/post-sale was previously a local-state stub
  // marked TODO. The post-sale-flow scheduler reads these values
  // when planning messages; nullables fall back to (2, 14, 60).
  getPostSaleConfig: protectedProcedure.query(async ({ ctx }) => {
    const tenant = await prisma.tenant.findUnique({
      where: { id: ctx.tenant.tenantId },
      select: {
        postSaleEnabled: true,
        postSaleDayDelay: true,
        postSaleWeekDelay: true,
        postSaleMonthDelay: true,
      },
    });
    return (
      tenant ?? {
        postSaleEnabled: true,
        postSaleDayDelay: 2,
        postSaleWeekDelay: 14,
        postSaleMonthDelay: 60,
      }
    );
  }),

  updatePostSaleConfig: protectedProcedure
    .input(
      z.object({
        enabled: z.boolean(),
        dayDelay: z.number().int().min(1).max(30),
        weekDelay: z.number().int().min(1).max(180),
        monthDelay: z.number().int().min(1).max(365),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await prisma.tenant.update({
        where: { id: ctx.tenant.tenantId },
        data: {
          postSaleEnabled: input.enabled,
          postSaleDayDelay: input.dayDelay,
          postSaleWeekDelay: input.weekDelay,
          postSaleMonthDelay: input.monthDelay,
        },
      });
      return { success: true };
    }),
});
