import { NextResponse, type NextRequest } from "next/server";
import Redis from "ioredis";
import {
  MercadoPagoWebhookSignatureError,
  MercadoPagoWebhookNotConfiguredError,
  parseMercadoPagoPayload,
  verifyMercadoPagoSignature,
} from "@wbc/business/finance/adapters/mercadopago-webhook-handler";
import { syncMpPayment } from "@wbc/business/sales/use-cases/sync-mp-payment";

// ACH-003 apis-integracoes: MercadoPago webhook route. The handler
// package parses/validates; this route plugs it into HTTP and logs
// the parsed notification. A production wire will forward the parsed
// payload to a payment-sync use-case that updates the local Payment
// row and publishes `PAYMENT_RECEIVED`.

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ACH-026 seguranca: dedup window for replay protection. MP retries on
// timeout, so 10 min is generous enough to dedup legitimate retries
// without holding state forever. Key = data.id + request-id (latter
// changes on every retry attempt; we dedup on data.id alone but include
// request-id in the value for forensic logging).
const REPLAY_DEDUP_TTL_SECONDS = 10 * 60;
let replayRedis: Redis | undefined;
function getReplayRedis(): Redis {
  if (!replayRedis) {
    replayRedis = new Redis(
      process.env.REDIS_URL ?? "redis://localhost:6379/0",
    );
  }
  return replayRedis;
}

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

  // ACH-026: replay protection. After signature passes, take an exclusive
  // lock keyed on data.id. Subsequent retries of the same delivery (same
  // dataId) get 200 immediately without re-running side effects, but a
  // legitimate first delivery proceeds normally. SET NX EX is atomic.
  const dedupKey = payload.data?.id
    ? `webhook:mp:dedup:${payload.data.id}`
    : null;
  if (dedupKey) {
    try {
      const claimed = await getReplayRedis().set(
        dedupKey,
        requestIdHeader,
        "EX",
        REPLAY_DEDUP_TTL_SECONDS,
        "NX",
      );
      if (claimed === null) {
        return NextResponse.json(
          { received: true, deduped: true },
          { status: 200 },
        );
      }
    } catch {
      // Redis hiccup — better to risk a duplicate process than reject a
      // legitimate webhook. Side-effect handlers downstream should already
      // be idempotent (Payment.markPaid via updateMany after ACH-023).
    }
  }

  // F11 follow-up: forward to the payment-sync use-case. We only act
  // on `payment` notifications — MP also fires "merchant_order"
  // events for orchestrated flows we don't use. Errors here go back
  // as 500 so MP retries (the retry will be deduped by the Redis
  // lock above when it re-fires within the TTL).
  if (payload.type === "payment" && payload.data?.id) {
    try {
      const result = await syncMpPayment({ mercadopagoId: payload.data.id });
      return NextResponse.json(
        {
          received: true,
          matched: result.matched,
          status: result.newStatus,
        },
        { status: 200 },
      );
    } catch (error) {
      // Fall through to 500 — MP will retry and the dedup lock
      // ensures we don't double-process once it succeeds.
      return NextResponse.json(
        {
          error: "sync_failed",
          message: error instanceof Error ? error.message : "unknown",
        },
        { status: 500 },
      );
    }
  }

  return NextResponse.json(
    {
      received: true,
      type: payload.type ?? null,
      action: payload.action ?? null,
    },
    { status: 200 },
  );
}
