import { prisma } from "@wbc/db";
import { subscribe, EVENTS } from "@wbc/shared";
import { logger } from "../lib/logger";
import { WhatsAppN2Adapter } from "@wbc/business/messaging/adapters/whatsapp-n2-adapter";
import { generateWhatsappLink } from "@wbc/business/messaging/use-cases/generate-whatsapp-link";
import { createPushableNotification } from "@wbc/business/schedule/use-cases/notification-fanout";
import { selectWhatsAppChannel } from "../lib/select-whatsapp-channel";

// Item 11 da spec / item 9 do handoff: confirmação automática de venda via
// WhatsApp.
//
// Estratégia:
//   - Tenant Pro com WHATSAPP_API_TOKEN configurado → envia mensagem N2
//     diretamente via Meta Cloud API (silent, idempotente).
//   - Tenant Essential ou sem token → emite Notification para a consultora
//     com o deep link N1 já pronto, pra ela mandar com 1 clique.
//
// Idempotência: usa `outbox.eventId` como X-Request-Id (Meta dedup) e marca
// `Sale.confirmationSentAt` no DB pra não mandar duas vezes mesmo se o
// outbox replay. Como `Sale` ainda não tem essa coluna, faço dedupe via
// Notification.type=`SALE_CONFIRMATION_<saleId>` quando rota N1.

const whatsappN2 = new WhatsAppN2Adapter();

interface SaleConfirmedPayload {
  saleId: string;
  tenantId: string;
}

export function registerSaleConfirmationMessenger(): void {
  subscribe(EVENTS.SALE_CONFIRMED, async (event) => {
    const payload = event.payload as unknown as SaleConfirmedPayload;
    if (!payload?.saleId || !payload?.tenantId) return;

    const sale = await prisma.sale.findFirst({
      where: { id: payload.saleId, tenantId: payload.tenantId },
      select: {
        id: true,
        clientId: true,
        client: { select: { name: true, phone: true } },
      },
    });
    if (!sale?.client) return;

    const link = generateWhatsappLink({
      phone: sale.client.phone,
      clientName: sale.client.name,
      kind: "SALE_CONFIRMED",
    });

    // Bloco 2 do plano: lógica N1/N2 extraída pra selectWhatsAppChannel
    // pra ser reutilizada pelo messaging-processor.
    const channel = await selectWhatsAppChannel(payload.tenantId);
    if (channel === "N2") {
      try {
        await whatsappN2.sendText(sale.client.phone, link.message, {
          idempotencyKey: `sale-confirmed:${sale.id}`,
        });
        logger.info(
          { saleId: sale.id, channel: "n2" },
          "sale confirmation sent via WhatsApp N2",
        );
      } catch (error) {
        // Fallback to N1 notification if N2 fails — operator still gets
        // an actionable nudge.
        logger.error(
          { saleId: sale.id, error: (error as Error).message },
          "sale confirmation N2 failed, falling back to N1 notification",
        );
        await emitConsultantNotification(payload.tenantId, sale.id, link.url);
      }
    } else {
      await emitConsultantNotification(payload.tenantId, sale.id, link.url);
    }
  });
}

async function emitConsultantNotification(
  tenantId: string,
  saleId: string,
  deepLink: string,
): Promise<void> {
  const type = `SALE_CONFIRMATION_${saleId}`;
  const existing = await prisma.notification.findFirst({
    where: { tenantId, type },
    select: { id: true },
  });
  if (existing) return;
  await createPushableNotification({
    tenantId,
    type,
    title: "Mande a confirmação da venda",
    body: deepLink,
  });
}
