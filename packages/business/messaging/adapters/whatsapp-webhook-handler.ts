import { createHash, createHmac, timingSafeEqual } from "crypto";

// Meta API webhook handler for message status updates
export interface WhatsAppWebhookPayload {
  entry?: Array<{
    changes?: Array<{
      value?: {
        statuses?: Array<{
          id: string;
          status: "sent" | "delivered" | "read" | "failed";
          timestamp: string;
        }>;
      };
    }>;
  }>;
}

export class WebhookSignatureError extends Error {
  constructor() {
    super("Invalid webhook signature");
    this.name = "WebhookSignatureError";
  }
}

// ACH-004 apis-integracoes: distinct error classes so the route can
// return 4xx cleanly (signature / timestamp / replay) instead of
// collapsing everything into a generic 401.
export class WebhookTimestampError extends Error {
  constructor(driftSeconds: number) {
    super(`Webhook timestamp out of bounds (drift=${driftSeconds}s)`);
    this.name = "WebhookTimestampError";
  }
}

export class WebhookReplayError extends Error {
  constructor() {
    super("Webhook request-id already processed (replay detected)");
    this.name = "WebhookReplayError";
  }
}

export function verifyWebhookSignature(
  rawBody: string,
  signature: string | undefined,
): void {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) {
    throw new Error("WHATSAPP_APP_SECRET is not configured");
  }

  if (!signature) {
    throw new WebhookSignatureError();
  }

  const expectedSignature =
    "sha256=" + createHmac("sha256", appSecret).update(rawBody).digest("hex");

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    sigBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    throw new WebhookSignatureError();
  }
}

/**
 * ACH-004 apis-integracoes: reject webhooks whose timestamp differs from
 * our clock by more than the allowed drift. Defaults match Meta's
 * guidance (5 min window). Using an explicit parameter instead of a
 * module-level constant so callers in tests can shrink it cheaply.
 *
 * Meta sends timestamps at the `entry[0].changes[0].value.statuses[0]
 * .timestamp` path (seconds). The route is responsible for pulling the
 * right field — this function just validates whatever it's given.
 */
export function verifyWebhookTimestamp(
  timestampSeconds: number,
  opts: { maxDriftSeconds?: number; nowMs?: number } = {},
): void {
  const maxDrift = opts.maxDriftSeconds ?? 300;
  const now = opts.nowMs ?? Date.now();
  if (!Number.isFinite(timestampSeconds)) {
    throw new WebhookTimestampError(Infinity);
  }
  const drift = Math.abs(now / 1000 - timestampSeconds);
  if (drift > maxDrift) {
    throw new WebhookTimestampError(Math.round(drift));
  }
}

/**
 * ACH-004 apis-integracoes: write-once Redis key per request-id. A
 * duplicate webhook (Meta retries, attacker replay) hits the cache and
 * throws `WebhookReplayError` without re-invoking the domain side
 * effects. TTL defaults to 10 min, comfortably larger than the drift
 * window so a replay inside that window can't slip through.
 *
 * The Redis handle is typed against a narrow shape so tests don't need
 * a full ioredis instance.
 */
export interface WebhookReplayRedis {
  set(
    key: string,
    value: string,
    mode: "EX",
    duration: number,
    nx: "NX",
  ): Promise<unknown>;
}

export async function ensureNotReplayed(
  requestId: string,
  redis: WebhookReplayRedis,
  opts: { ttlSeconds?: number; prefix?: string } = {},
): Promise<void> {
  const ttl = opts.ttlSeconds ?? 600;
  const prefix = opts.prefix ?? "wh:wa:";
  const key = `${prefix}${createHash("sha256").update(requestId).digest("hex").slice(0, 32)}`;
  // SET ... NX returns null when the key already exists; that's the
  // signal a previous call for the same request-id is still cached.
  const result = await redis.set(key, "1", "EX", ttl, "NX");
  if (result === null) {
    throw new WebhookReplayError();
  }
}

export function parseWebhookStatuses(
  payload: WhatsAppWebhookPayload,
): Array<{ messageId: string; status: string }> {
  const statuses: Array<{ messageId: string; status: string }> = [];

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const status of change.value?.statuses ?? []) {
        statuses.push({ messageId: status.id, status: status.status });
      }
    }
  }

  return statuses;
}

/**
 * Extract the most recent timestamp from a Meta webhook payload.
 * Returns `NaN` when the payload has no status events so callers can
 * fail cleanly via `verifyWebhookTimestamp`.
 */
export function extractWebhookTimestamp(
  payload: WhatsAppWebhookPayload,
): number {
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const status of change.value?.statuses ?? []) {
        const n = Number(status.timestamp);
        if (Number.isFinite(n)) return n;
      }
    }
  }
  return Number.NaN;
}
