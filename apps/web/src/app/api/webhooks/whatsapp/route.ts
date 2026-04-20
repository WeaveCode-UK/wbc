import { NextResponse, type NextRequest } from "next/server";
import {
  WebhookSignatureError,
  WebhookTimestampError,
  WebhookReplayError,
  ensureNotReplayed,
  extractWebhookTimestamp,
  parseWebhookStatuses,
  verifyWebhookSignature,
  verifyWebhookTimestamp,
  type WhatsAppWebhookPayload,
  type WebhookReplayRedis,
} from "@wbc/business/messaging/adapters/whatsapp-webhook-handler";

// ACH-003 apis-integracoes: Next.js route mounting the existing
// `whatsapp-webhook-handler`. Before this, the handler was exported
// from the package but nothing HTTP-accessible called it, so status
// updates from Meta never reached the system.
//
// ACH-004 apis-integracoes: replay protection. Signature verify first,
// then timestamp window, then Redis NX-based dedup on the request id.
// Each failure maps to a distinct status so ops can tell them apart
// from the access logs.

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // handler uses `crypto`

// Meta sends a GET on first registration with a verify token challenge.
// We echo `hub.challenge` back only when the verify token matches.
export async function GET(req: NextRequest) {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  if (!verifyToken) {
    return NextResponse.json(
      { error: "WHATSAPP_VERIFY_TOKEN not configured" },
      { status: 500 },
    );
  }

  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === verifyToken && challenge) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
  return NextResponse.json({ error: "verification failed" }, { status: 403 });
}

async function getReplayRedis(): Promise<WebhookReplayRedis | null> {
  try {
    // Dynamic import to avoid pulling ioredis into the edge bundle; the
    // route already pins `runtime: nodejs` so this is safe at runtime.
    const mod = await import("ioredis");
    const RedisCtor = mod.default;
    const url = process.env.REDIS_URL ?? "redis://localhost:6379/0";
    return new RedisCtor(url) as unknown as WebhookReplayRedis;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  try {
    verifyWebhookSignature(
      rawBody,
      req.headers.get("x-hub-signature-256") ?? undefined,
    );
  } catch (error) {
    if (error instanceof WebhookSignatureError) {
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }
    // Missing secret env → 500, operator problem not caller problem.
    return NextResponse.json(
      { error: "server misconfigured" },
      { status: 500 },
    );
  }

  let payload: WhatsAppWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as WhatsAppWebhookPayload;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  // Timestamp window guard.
  try {
    const ts = extractWebhookTimestamp(payload);
    verifyWebhookTimestamp(ts);
  } catch (error) {
    if (error instanceof WebhookTimestampError) {
      return NextResponse.json({ error: "stale webhook" }, { status: 400 });
    }
    throw error;
  }

  // Replay guard using Meta's `x-request-id` (header present on every
  // delivery). Graceful degradation when Redis isn't reachable — we
  // still process the event; the signature + timestamp gates already
  // block trivial replays.
  const requestId = req.headers.get("x-request-id");
  if (requestId) {
    const redis = await getReplayRedis();
    if (redis) {
      try {
        await ensureNotReplayed(requestId, redis);
      } catch (error) {
        if (error instanceof WebhookReplayError) {
          return NextResponse.json({ error: "replay" }, { status: 409 });
        }
        // Redis threw some other way — don't block the webhook.
      }
    }
  }

  const statuses = parseWebhookStatuses(payload);
  // TODO(ACH-003 follow-up): dispatch statuses to an event/use-case
  // that updates Message rows. Kept as a no-op so the endpoint is
  // wire-safe today; the use-case lands separately.
  return NextResponse.json({ received: statuses.length }, { status: 200 });
}
