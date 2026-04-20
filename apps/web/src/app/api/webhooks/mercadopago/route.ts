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
      signatureHeader: req.headers.get("x-signature") ?? undefined,
      requestIdHeader: req.headers.get("x-request-id") ?? undefined,
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
