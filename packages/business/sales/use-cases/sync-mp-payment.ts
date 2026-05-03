import { prisma } from "@wbc/db";
import { publish, EVENTS } from "@wbc/shared";
import { getMpPayment } from "../../finance/adapters/mercadopago-api-client";

// F11 follow-up: webhook → local payment sync. Called by the
// /api/webhooks/mercadopago route after signature + replay checks
// pass. Idempotent: re-running on a Payment that's already PAID is
// a no-op, so MP retries don't double-credit anything.

export interface SyncMpPaymentInput {
  mercadopagoId: string;
}

export interface SyncMpPaymentResult {
  matched: boolean;
  paymentId: string | null;
  newStatus: string | null;
}

export async function syncMpPayment(
  input: SyncMpPaymentInput,
): Promise<SyncMpPaymentResult> {
  const remote = await getMpPayment(input.mercadopagoId);
  // Only "approved" transitions us to PAID. The other statuses
  // (pending, in_process, rejected, cancelled) stay as warnings on
  // the local row — we don't reverse PAID locally because that's a
  // chargeback flow and needs human review.
  const localPayment = await prisma.payment.findFirst({
    where: { mercadopagoId: input.mercadopagoId },
    include: {
      sale: { select: { tenantId: true, id: true } },
    },
  });
  if (!localPayment) {
    return { matched: false, paymentId: null, newStatus: null };
  }
  if (localPayment.status === "PAID") {
    return {
      matched: true,
      paymentId: localPayment.id,
      newStatus: localPayment.status,
    };
  }

  if (remote.status === "approved") {
    await prisma.payment.update({
      where: { id: localPayment.id },
      data: { status: "PAID", paidAt: new Date() },
    });
    await publish(EVENTS.PAYMENT_RECEIVED, localPayment.sale.tenantId, {
      paymentId: localPayment.id,
      saleId: localPayment.sale.id,
      mercadopagoId: input.mercadopagoId,
      amount: remote.amount,
    });
    return { matched: true, paymentId: localPayment.id, newStatus: "PAID" };
  }

  return {
    matched: true,
    paymentId: localPayment.id,
    newStatus: remote.status,
  };
}
