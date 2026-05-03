// T3.1 — WhatsAppN2Adapter (Meta Cloud API)
//
// Why these specifically:
//  - Payload shape locks the contract Meta requires (`messaging_product`,
//    `to`, `type`, `[type]: content`). A regression here is silent in dev
//    (no live token) and only visible in prod after we ship a broken send.
//  - 429 + 5xx must retry with backoff; 4xx (non-429) must NOT retry —
//    those are caller-side bugs (bad token, bad number) that retry won't
//    fix.
//  - `idempotencyKey` round-trips into `X-Request-Id` (ACH-016) so Meta
//    coalesces outbox-driven retries instead of double-sending.
//
// Fetch is mocked at the global scope and restored in `afterEach`; the
// adapter retry policy is overridden with `baseDelayMs: 0` so we don't
// have to drive fake timers across an `await sleep()` (which is fragile
// when the awaited promise also depends on a fake-timer-driven AbortController).

import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type Mock,
} from "vitest";
import { WhatsAppN2Adapter } from "../whatsapp-n2-adapter";

const ORIGINAL_FETCH = globalThis.fetch;
const ORIGINAL_ENV = { ...process.env };

interface FetchInit {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

function mockFetchSequence(
  responses: Array<{ ok: boolean; status: number; json?: unknown }>,
): Mock {
  let i = 0;
  const fn = vi.fn().mockImplementation(async () => {
    const r = responses[Math.min(i, responses.length - 1)]!;
    i++;
    return {
      ok: r.ok,
      status: r.status,
      json: async () => r.json ?? {},
    } as unknown as Response;
  });
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
}

beforeEach(() => {
  process.env.WHATSAPP_API_TOKEN = "test-token";
  process.env.WHATSAPP_PHONE_NUMBER_ID = "PHONE-1";
  // Force no retries / zero delay by default so the test doesn't have to
  // tick fake timers. Individual tests override.
  process.env.WHATSAPP_MAX_RETRIES = "0";
  process.env.WHATSAPP_RETRY_DELAY_MS = "1";
  process.env.WHATSAPP_TIMEOUT_MS = "10000";
  process.env.WHATSAPP_CIRCUIT_THRESHOLD = "999";
});

afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH;
  process.env = { ...ORIGINAL_ENV };
});

describe("WhatsAppN2Adapter — Meta Cloud API payload shape", () => {
  it("posts to /{phoneNumberId}/messages with text payload + Bearer token", async () => {
    const fn = mockFetchSequence([
      { ok: true, status: 200, json: { messages: [{ id: "wamid.X" }] } },
    ]);
    const adapter = new WhatsAppN2Adapter({
      retry: { maxRetries: 0, baseDelayMs: 1 },
    });

    const r = await adapter.sendText("+55 11 91234-5678", "Olá");

    expect(r.success).toBe(true);
    expect(r.messageId).toBe("wamid.X");
    expect(fn).toHaveBeenCalledOnce();
    const [url, init] = fn.mock.calls[0] as [string, FetchInit];
    expect(url).toBe("https://graph.facebook.com/v18.0/PHONE-1/messages");
    expect(init.method).toBe("POST");
    expect(init.headers?.Authorization).toBe("Bearer test-token");
    expect(init.headers?.["Content-Type"]).toBe("application/json");
    const body = JSON.parse(init.body ?? "{}");
    expect(body).toEqual({
      messaging_product: "whatsapp",
      to: "5511912345678", // formatPhoneForWhatsApp strips non-digits
      type: "text",
      text: { body: "Olá" },
    });
  });

  it("encodes image payload with link + caption", async () => {
    const fn = mockFetchSequence([
      { ok: true, status: 200, json: { messages: [{ id: "wamid.IMG" }] } },
    ]);
    const adapter = new WhatsAppN2Adapter({
      retry: { maxRetries: 0, baseDelayMs: 1 },
    });

    await adapter.sendImage("+5511999990000", "https://cdn.x/p.jpg", "Look");

    const init = fn.mock.calls[0]![1] as FetchInit;
    const body = JSON.parse(init.body ?? "{}");
    expect(body.type).toBe("image");
    expect(body.image).toEqual({
      link: "https://cdn.x/p.jpg",
      caption: "Look",
    });
  });

  it("encodes audio payload with link only", async () => {
    const fn = mockFetchSequence([
      { ok: true, status: 200, json: { messages: [{ id: "wamid.AUD" }] } },
    ]);
    const adapter = new WhatsAppN2Adapter({
      retry: { maxRetries: 0, baseDelayMs: 1 },
    });

    await adapter.sendAudio("+5511999990000", "https://cdn.x/a.mp3");

    const init = fn.mock.calls[0]![1] as FetchInit;
    const body = JSON.parse(init.body ?? "{}");
    expect(body.type).toBe("audio");
    expect(body.audio).toEqual({ link: "https://cdn.x/a.mp3" });
  });

  it("forwards opts.idempotencyKey as X-Request-Id (ACH-016)", async () => {
    const fn = mockFetchSequence([
      { ok: true, status: 200, json: { messages: [{ id: "wamid.K" }] } },
    ]);
    const adapter = new WhatsAppN2Adapter({
      retry: { maxRetries: 0, baseDelayMs: 1 },
    });

    await adapter.sendText("+5511999990000", "hi", {
      idempotencyKey: "outbox-evt-42",
    });

    const init = fn.mock.calls[0]![1] as FetchInit;
    expect(init.headers?.["X-Request-Id"]).toBe("outbox-evt-42");
  });

  it("auto-generates X-Request-Id when no idempotencyKey is supplied", async () => {
    const fn = mockFetchSequence([
      { ok: true, status: 200, json: { messages: [{ id: "wamid.A" }] } },
    ]);
    const adapter = new WhatsAppN2Adapter({
      retry: { maxRetries: 0, baseDelayMs: 1 },
    });

    await adapter.sendText("+5511999990000", "hi");

    const init = fn.mock.calls[0]![1] as FetchInit;
    expect(init.headers?.["X-Request-Id"]).toMatch(/^whreq_/);
  });
});

describe("WhatsAppN2Adapter — retry semantics", () => {
  it("retries on 429 then succeeds on the second attempt", async () => {
    const fn = mockFetchSequence([
      { ok: false, status: 429 },
      { ok: true, status: 200, json: { messages: [{ id: "wamid.OK" }] } },
    ]);
    const adapter = new WhatsAppN2Adapter({
      retry: { maxRetries: 2, baseDelayMs: 1 },
    });

    const r = await adapter.sendText("+5511999990000", "hi");

    expect(r.success).toBe(true);
    expect(r.messageId).toBe("wamid.OK");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("retries on 503 then succeeds on the second attempt", async () => {
    const fn = mockFetchSequence([
      { ok: false, status: 503 },
      { ok: true, status: 200, json: { messages: [{ id: "wamid.S" }] } },
    ]);
    const adapter = new WhatsAppN2Adapter({
      retry: { maxRetries: 2, baseDelayMs: 1 },
    });

    const r = await adapter.sendText("+5511999990000", "hi");

    expect(r.success).toBe(true);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("does NOT retry on 400 — caller-side bug, retry won't fix it", async () => {
    const fn = mockFetchSequence([{ ok: false, status: 400 }]);
    const adapter = new WhatsAppN2Adapter({
      retry: { maxRetries: 5, baseDelayMs: 1 },
    });

    const r = await adapter.sendText("+5511999990000", "hi");

    expect(r.success).toBe(false);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("does NOT retry on 401 (auth) and surfaces success=false", async () => {
    const fn = mockFetchSequence([{ ok: false, status: 401 }]);
    const adapter = new WhatsAppN2Adapter({
      retry: { maxRetries: 5, baseDelayMs: 1 },
    });

    const r = await adapter.sendText("+5511999990000", "hi");

    expect(r.success).toBe(false);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("gives up after maxRetries+1 attempts on persistent 429", async () => {
    const fn = mockFetchSequence([
      { ok: false, status: 429 },
      { ok: false, status: 429 },
      { ok: false, status: 429 },
    ]);
    const adapter = new WhatsAppN2Adapter({
      retry: { maxRetries: 2, baseDelayMs: 1 },
    });

    const r = await adapter.sendText("+5511999990000", "hi");

    expect(r.success).toBe(false);
    expect(fn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });

  it("treats malformed responses (missing `messages`) as failure", async () => {
    const fn = mockFetchSequence([
      { ok: true, status: 200, json: { not_messages: [] } },
    ]);
    const adapter = new WhatsAppN2Adapter({
      retry: { maxRetries: 0, baseDelayMs: 1 },
    });

    const r = await adapter.sendText("+5511999990000", "hi");

    expect(r.success).toBe(false);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries with linear backoff (baseDelayMs * (attempt+1))", async () => {
    // We don't need fake timers — we just check the call was made N+1
    // times. The backoff math is exercised by `whatsappRetryPolicy`'s
    // own unit test in @wbc/shared/resilience.
    const fn = mockFetchSequence([
      { ok: false, status: 500 },
      { ok: false, status: 500 },
      { ok: true, status: 200, json: { messages: [{ id: "wamid.B" }] } },
    ]);
    const adapter = new WhatsAppN2Adapter({
      retry: { maxRetries: 3, baseDelayMs: 1 },
    });

    const r = await adapter.sendText("+5511999990000", "hi");
    expect(r.success).toBe(true);
    expect(fn).toHaveBeenCalledTimes(3);
  });
});

describe("WhatsAppN2Adapter — phoneNumberId routing", () => {
  it("routes to the configured WHATSAPP_PHONE_NUMBER_ID in the URL", async () => {
    process.env.WHATSAPP_PHONE_NUMBER_ID = "OTHER-PHONE-ID-99";
    const fn = mockFetchSequence([
      { ok: true, status: 200, json: { messages: [{ id: "wamid.Z" }] } },
    ]);
    const adapter = new WhatsAppN2Adapter({
      retry: { maxRetries: 0, baseDelayMs: 1 },
    });

    await adapter.sendText("+5511999990000", "hi");

    const url = fn.mock.calls[0]![0] as string;
    expect(url).toContain("/OTHER-PHONE-ID-99/messages");
  });
});
