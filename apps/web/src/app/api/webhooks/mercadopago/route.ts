import { NextResponse, type NextRequest } from "next/server";
import {
  MercadoPagoWebhookSignatureError,
  MercadoPagoWebhookNotConfiguredError,
  parseMercadoPagoPayload,
  verifyMercadoPagoSignature,
} from "@wbc/business/finance/adapters/mercadopago-webhook-handler";

// ACH-003 apis-integracoes: MercadoPago webhook route. The handler
// package parses/validates; this route plugs it into HTTP and logs
// the parsed notification. A production wire will forward the parsed
// payload to a payment-sync use-case that updates the local Payment
// row and publishes `PAYMENT_RECEIVED`.

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // ACH-052: short-circuit on missing signature headers BEFORE doing the
  // JSON.parse so we don't burn CPU on bodies that are obviously not
  // legitimate webhooks (e.g. unauthenticated probes). The HMAC check
  // itself still requires `dataId` from the parsed body, but at least we
  // refuse the unsigned ones up front.
  const signatureHeader = req.headers.get("x-signature") ?? undefined;
  const requestIdHeader = req.headers.get("x-request-id") ?? undefined;
  if (!signatureHeader || !requestIdHeader) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const rawBody = await req.text();
  let payload: ReturnType<typeof parseMercadoPagoPayload>;
  try {
    payload = parseMercadoPagoPayload(JSON.parse(rawBody));
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  try {
    verifyMercadoPagoSignature({
      rawBody,
      signatureHeader,
      requestIdHeader,
      dataId: payload.data?.id,
    });
  } catch (error) {
    if (error instanceof MercadoPagoWebhookNotConfiguredError) {
      return NextResponse.json(
        { error: "server misconfigured" },
        { status: 500 },
      );
    }
    if (error instanceof MercadoPagoWebhookSignatureError) {
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }
    throw error;
  }

  // TODO(ACH-003 follow-up): forward `payload` to a payment-sync use-case
  // that updates Payment.status and publishes PAYMENT_RECEIVED.
  return NextResponse.json(
    {
      received: true,
      type: payload.type ?? null,
      action: payload.action ?? null,
    },
    { status: 200 },
  );
}
