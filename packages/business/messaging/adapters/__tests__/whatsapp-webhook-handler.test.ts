import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createHmac } from "crypto";
import {
  WebhookSignatureError,
  WebhookTimestampError,
  WebhookReplayError,
  ensureNotReplayed,
  extractWebhookTimestamp,
  parseWebhookStatuses,
  verifyWebhookSignature,
  verifyWebhookTimestamp,
  type WebhookReplayRedis,
} from "../whatsapp-webhook-handler";

const SECRET = "test-secret-12345";

function sign(body: string): string {
  return "sha256=" + createHmac("sha256", SECRET).update(body).digest("hex");
}

describe("verifyWebhookSignature (item 8 — Meta x-hub-signature-256)", () => {
  let originalSecret: string | undefined;

  beforeEach(() => {
    originalSecret = process.env.WHATSAPP_APP_SECRET;
    process.env.WHATSAPP_APP_SECRET = SECRET;
  });

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.WHATSAPP_APP_SECRET;
    else process.env.WHATSAPP_APP_SECRET = originalSecret;
  });

  it("accepts a body whose HMAC matches the header", () => {
    const body = '{"object":"whatsapp_business_account"}';
    expect(() => verifyWebhookSignature(body, sign(body))).not.toThrow();
  });

  it("rejects when signature header is missing", () => {
    expect(() => verifyWebhookSignature('{"x":1}', undefined)).toThrowError(
      WebhookSignatureError,
    );
  });

  it("rejects when signature does not match the body", () => {
    expect(() =>
      verifyWebhookSignature('{"x":1}', sign('{"x":2}')),
    ).toThrowError(WebhookSignatureError);
  });

  it("rejects when the signature has wrong length (no timing leak)", () => {
    expect(() =>
      verifyWebhookSignature('{"x":1}', "sha256=tooshort"),
    ).toThrowError(WebhookSignatureError);
  });

  it("throws a non-WebhookSignatureError when WHATSAPP_APP_SECRET is missing", () => {
    delete process.env.WHATSAPP_APP_SECRET;
    expect(() => verifyWebhookSignature('{"x":1}', sign("{}"))).toThrow(
      /WHATSAPP_APP_SECRET is not configured/,
    );
  });
});

describe("verifyWebhookTimestamp", () => {
  it("accepts a timestamp inside the drift window", () => {
    const now = 1_700_000_000_000;
    expect(() =>
      verifyWebhookTimestamp(now / 1000 - 60, { nowMs: now }),
    ).not.toThrow();
  });

  it("rejects a timestamp older than the drift window", () => {
    const now = 1_700_000_000_000;
    expect(() =>
      verifyWebhookTimestamp(now / 1000 - 10_000, { nowMs: now }),
    ).toThrowError(WebhookTimestampError);
  });
});

describe("ensureNotReplayed", () => {
  function makeRedis(returnValue: "OK" | null): WebhookReplayRedis {
    return {
      set: async () => returnValue,
    };
  }

  it("passes on first delivery (Redis SET NX returns OK)", async () => {
    await expect(
      ensureNotReplayed("req-123", makeRedis("OK")),
    ).resolves.toBeUndefined();
  });

  it("rejects on duplicate delivery (Redis SET NX returns null)", async () => {
    await expect(
      ensureNotReplayed("req-123", makeRedis(null)),
    ).rejects.toBeInstanceOf(WebhookReplayError);
  });
});

describe("extractWebhookTimestamp", () => {
  it("pulls timestamp from entry[0].changes[0].value.statuses[0].timestamp", () => {
    const ts = extractWebhookTimestamp({
      entry: [
        {
          changes: [
            {
              value: {
                statuses: [
                  { timestamp: "1700000000", id: "wamid.x", status: "sent" },
                ],
              },
            },
          ],
        },
      ],
    });
    expect(ts).toBe(1_700_000_000);
  });
});

describe("parseWebhookStatuses", () => {
  it("returns the statuses array when present", () => {
    const statuses = parseWebhookStatuses({
      entry: [
        {
          changes: [
            {
              value: {
                statuses: [
                  { id: "wamid.a", status: "delivered", timestamp: "1" },
                ],
              },
            },
          ],
        },
      ],
    });
    expect(statuses).toHaveLength(1);
    expect(statuses[0]?.status).toBe("delivered");
  });

  it("returns empty array when there are no statuses", () => {
    expect(parseWebhookStatuses({ entry: [] })).toEqual([]);
  });
});
