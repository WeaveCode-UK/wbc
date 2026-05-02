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
import { uuidSchema } from "@wbc/validators";
// ACH-008 apis-integracoes: schema centralised in @wbc/validators.
import { sendToClientSchema } from "@wbc/validators";

const whatsappN1 = new WhatsAppN1Adapter();
const whatsappN2 = new WhatsAppN2Adapter();
const clientRepo = new PrismaClientRepository();

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
});
