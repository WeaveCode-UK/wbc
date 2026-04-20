// ACH-003 apis-integracoes: MercadoPago webhook verification (skeleton).
//
// The Prisma schema has `mercadopagoId` columns on payments, but there's
// no adapter to receive MP's async notifications. This handler verifies
// the request's HMAC signature (MP sends `x-signature` with a shared
// secret set in their dashboard) and extracts the notification type +
// resource id.
//
// Processing of the payload (looking up the payment, updating status,
// publishing a domain event) is intentionally out of scope here — that
// work depends on the final MP integration choice (direct API vs. Pix-
// only vs. Pagbank alternative) and needs real credentials to test end-
// to-end. The web route (`apps/web/src/app/api/webhooks/mercadopago/
// route.ts`) wires this verifier and logs the parsed payload until the
// payment-sync use-case lands.

import { createHmac, timingSafeEqual } from "crypto";

export class MercadoPagoWebhookSignatureError extends Error {
  constructor() {
    super("Invalid MercadoPago webhook signature");
    this.name = "MercadoPagoWebhookSignatureError";
  }
}

export class MercadoPagoWebhookNotConfiguredError extends Error {
  constructor() {
    super("MERCADOPAGO_WEBHOOK_SECRET not configured");
    this.name = "MercadoPagoWebhookNotConfiguredError";
  }
}

export interface MercadoPagoWebhookPayload {
  action?: string;
  api_version?: string;
  data?: { id?: string };
  date_created?: string;
  id?: string | number;
  live_mode?: boolean;
  type?: string;
  user_id?: string;
}

/**
 * Verify MP's `x-signature` / `x-request-id` pair. MP documents two
 * formats; the recent (2024+) one uses `ts=<unix>,v1=<hmac>`. Callers
 * should pass the raw body and both headers; we recompute the hmac over
 * `id:<data.id>;request-id:<x-request-id>;ts:<ts>` and compare in
 * constant time.
 */
export function verifyMercadoPagoSignature(params: {
  rawBody: string;
  signatureHeader: string | undefined;
  requestIdHeader: string | undefined;
  dataId: string | undefined;
}): void {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    throw new MercadoPagoWebhookNotConfiguredError();
  }
  if (!params.signatureHeader || !params.requestIdHeader || !params.dataId) {
    throw new MercadoPagoWebhookSignatureError();
  }

  const parts = params.signatureHeader
    .split(",")
    .map((s) => s.trim())
    .reduce<Record<string, string>>((acc, part) => {
      const eq = part.indexOf("=");
      if (eq > 0) acc[part.slice(0, eq)] = part.slice(eq + 1);
      return acc;
    }, {});

  const ts = parts.ts;
  const received = parts.v1;
  if (!ts || !received) {
    throw new MercadoPagoWebhookSignatureError();
  }

  const template = `id:${params.dataId};request-id:${params.requestIdHeader};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(template).digest("hex");

  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new MercadoPagoWebhookSignatureError();
  }
}

/**
 * Shallow parse — pulls out the fields the web route logs today. When
 * the payment-sync use-case lands, tighten to a Zod schema (mirrors
 * ACH-019's approach for WhatsApp responses).
 */
export function parseMercadoPagoPayload(
  raw: unknown,
): MercadoPagoWebhookPayload {
  if (typeof raw !== "object" || raw === null) return {};
  const r = raw as Record<string, unknown>;
  const data =
    typeof r.data === "object" && r.data !== null
      ? (r.data as Record<string, unknown>)
      : undefined;
  return {
    action: typeof r.action === "string" ? r.action : undefined,
    api_version: typeof r.api_version === "string" ? r.api_version : undefined,
    data:
      data && typeof data.id !== "undefined"
        ? { id: String(data.id) }
        : undefined,
    date_created:
      typeof r.date_created === "string" ? r.date_created : undefined,
    id: typeof r.id === "string" || typeof r.id === "number" ? r.id : undefined,
    live_mode: typeof r.live_mode === "boolean" ? r.live_mode : undefined,
    type: typeof r.type === "string" ? r.type : undefined,
    user_id: typeof r.user_id === "string" ? r.user_id : undefined,
  };
}
