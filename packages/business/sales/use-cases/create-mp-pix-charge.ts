import { prisma } from "@wbc/db";
import { createMpPixPayment } from "../../finance/adapters/mercadopago-api-client";

// F11 follow-up: dynamic PIX via Mercado Pago. Unlike the static BR
// Code (use-case generate-pix), this one calls MP, gets a real charge
// id, and stores it on the Payment row so the webhook (route at
// /api/webhooks/mercadopago) can sync the paidAt automatically when
// the customer's bank settles the transfer.

export interface CreateMpPixInput {
  tenantId: string;
  paymentId: string;
}

export interface CreateMpPixResult {
  mercadopagoId: string;
  pixQrCode: string;
  qrCodeBase64: string;
  ticketUrl: string;
  expiresAt: string;
}

export async function createMpPixCharge(
  input: CreateMpPixInput,
): Promise<CreateMpPixResult> {
  const payment = await prisma.payment.findFirst({
    where: { id: input.paymentId, sale: { tenantId: input.tenantId } },
    include: {
      sale: {
        select: {
          id: true,
          client: { select: { name: true, email: true } },
        },
      },
    },
  });
  if (!payment) {
    throw new Error("payment_not_found");
  }
  if (payment.status === "PAID") {
    throw new Error("payment_already_paid");
  }

  const txid = `WBC${payment.id.replace(/-/g, "").slice(0, 22)}`;
  const charge = await createMpPixPayment({
    amount: Number(payment.amount),
    description: `Venda ${payment.sale.id.slice(0, 8)}`,
    txid,
    payerEmail: payment.sale.client.email ?? undefined,
    payerName: payment.sale.client.name,
    expiresInHours: 24,
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      mercadopagoId: charge.id,
      pixQrCode: charge.qrCode,
      pixLink: charge.ticketUrl,
    },
  });

  return {
    mercadopagoId: charge.id,
    pixQrCode: charge.qrCode,
    qrCodeBase64: charge.qrCodeBase64,
    ticketUrl: charge.ticketUrl,
    expiresAt: charge.expiresAt,
  };
}
