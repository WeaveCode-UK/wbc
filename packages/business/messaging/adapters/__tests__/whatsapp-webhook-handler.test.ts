import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
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

  // T3.2 — fuzz: any byte-level mutation of a valid signature must reject.
  // We don't test "the math behind HMAC" — that's stdlib. We test that
  // the verifier doesn't have an off-by-one, prefix-only, or length-only
  // shortcut.
  it("rejects every single-byte mutation of a valid signature (fuzz)", () => {
    const body = '{"object":"whatsapp_business_account","entry":[]}';
    const valid = sign(body);
    // Mutate each hex char (skip the "sha256=" prefix) and assert reject.
    for (let i = 7; i < valid.length; i++) {
      const ch = valid[i]!;
      const mutated =
        valid.slice(0, i) + (ch === "0" ? "1" : "0") + valid.slice(i + 1);
      expect(() => verifyWebhookSignature(body, mutated)).toThrowError(
        WebhookSignatureError,
      );
    }
  });

  it("rejects truncated signatures of every length (fuzz)", () => {
    const body = '{"x":1}';
    const valid = sign(body);
    for (let cut = 8; cut < valid.length; cut++) {
      expect(() =>
        verifyWebhookSignature(body, valid.slice(0, cut)),
      ).toThrowError(WebhookSignatureError);
    }
  });

  it("rejects signatures with the wrong algorithm prefix", () => {
    const body = '{"x":1}';
    const valid = sign(body);
    const sha1ish = valid.replace(/^sha256=/, "sha1=");
    expect(() => verifyWebhookSignature(body, sha1ish)).toThrowError(
      WebhookSignatureError,
    );
  });

  it("rejects signatures with extra junk bytes appended", () => {
    const body = '{"x":1}';
    const valid = sign(body);
    expect(() => verifyWebhookSignature(body, valid + "AA")).toThrowError(
      WebhookSignatureError,
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

  // T3.2 — `delivered` and `read` status values must round-trip through
  // the parser unchanged. The route layer pipes these into a
  // CampaignRecipient repo update; if the parser ever lowercased / coerced
  // the value the downstream WHERE clause would silently miss rows.
  it("preserves `delivered` status verbatim for downstream mapping", () => {
    const statuses = parseWebhookStatuses({
      entry: [
        {
          changes: [
            {
              value: {
                statuses: [
                  { id: "wamid.D", status: "delivered", timestamp: "1" },
                ],
              },
            },
          ],
        },
      ],
    });
    expect(statuses).toEqual([{ messageId: "wamid.D", status: "delivered" }]);
  });

  it("preserves `read` status verbatim for downstream mapping", () => {
    const statuses = parseWebhookStatuses({
      entry: [
        {
          changes: [
            {
              value: {
                statuses: [{ id: "wamid.R", status: "read", timestamp: "2" }],
              },
            },
          ],
        },
      ],
    });
    expect(statuses).toEqual([{ messageId: "wamid.R", status: "read" }]);
  });

  it("flattens multiple entries / changes into a single ordered list", () => {
    const statuses = parseWebhookStatuses({
      entry: [
        {
          changes: [
            {
              value: {
                statuses: [
                  { id: "wamid.1", status: "sent", timestamp: "1" },
                  { id: "wamid.2", status: "delivered", timestamp: "2" },
                ],
              },
            },
            {
              value: {
                statuses: [{ id: "wamid.3", status: "read", timestamp: "3" }],
              },
            },
          ],
        },
      ],
    });
    expect(statuses.map((s) => s.messageId)).toEqual([
      "wamid.1",
      "wamid.2",
      "wamid.3",
    ]);
  });

  it("simulates the route's CampaignRecipient mapping by feeding the parser into a repo mock", async () => {
    // Today the route handler has a TODO for this dispatch (see
    // apps/web/src/app/api/webhooks/whatsapp/route.ts:121); we mirror
    // the contract here so when the use-case lands we have a regression
    // anchor for the parse → repo handoff.
    const repo = {
      markStatus: vi.fn().mockResolvedValue(undefined),
    };
    const statuses = parseWebhookStatuses({
      entry: [
        {
          changes: [
            {
              value: {
                statuses: [
                  { id: "wamid.D", status: "delivered", timestamp: "1" },
                  { id: "wamid.R", status: "read", timestamp: "2" },
                ],
              },
            },
          ],
        },
      ],
    });
    for (const s of statuses) {
      await repo.markStatus(s.messageId, s.status);
    }
    expect(repo.markStatus).toHaveBeenCalledTimes(2);
    expect(repo.markStatus).toHaveBeenNthCalledWith(1, "wamid.D", "delivered");
    expect(repo.markStatus).toHaveBeenNthCalledWith(2, "wamid.R", "read");
  });
});
