import { prisma } from "@wbc/db";
import { buildPixBrCode } from "./pix-brcode";

// F11 follow-up: PIX generation for a payment row. Reads the
// tenant's PIX merchant config, builds the BR Code, persists both
// the textual payload (`pixQrCode` — that's the "copia e cola" the
// customer pastes into her bank app) and an in-tenant link so the
// consultora can copy it from the dashboard.

export interface GeneratePixInput {
  tenantId: string;
  paymentId: string;
}

export interface GeneratePixResult {
  pixQrCode: string;
  pixLink: string;
}

export async function generatePixForPayment(
  input: GeneratePixInput,
): Promise<GeneratePixResult> {
  const payment = await prisma.payment.findFirst({
    where: { id: input.paymentId, sale: { tenantId: input.tenantId } },
    select: { id: true, amount: true, sale: { select: { id: true } } },
  });
  if (!payment) {
    throw new Error("payment_not_found");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: input.tenantId },
    select: {
      pixKey: true,
      pixMerchantName: true,
      pixMerchantCity: true,
    },
  });
  if (!tenant?.pixKey) {
    throw new Error("pix_not_configured");
  }

  // txid: stable per payment so the BR Code is idempotent — the
  // customer can re-scan the same QR without duplicate entries on the
  // bank's side. BACEN allows up to 25 alphanumeric chars.
  const txid = `WBC${payment.id.replace(/-/g, "").slice(0, 22)}`;
  const pixQrCode = buildPixBrCode({
    pixKey: tenant.pixKey,
    merchantName: tenant.pixMerchantName ?? "Consultora WBC",
    merchantCity: tenant.pixMerchantCity ?? "BRASIL",
    amount: Number(payment.amount),
    txid,
  });

  const pixLink = `pix://payment?txid=${encodeURIComponent(txid)}`;

  await prisma.payment.update({
    where: { id: payment.id },
    data: { pixQrCode, pixLink },
  });

  return { pixQrCode, pixLink };
}
