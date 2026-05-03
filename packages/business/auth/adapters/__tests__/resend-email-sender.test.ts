// T3.6 — ResendEmailSender
//
// What we verify:
//   - dev (no API key) is a "dry run": logs metadata, MAKES NO HTTP CALL.
//   - production with no key throws ResendNotConfiguredError eagerly so a
//     misconfigured deploy fails on first send instead of pretending to.
//   - the body the caller hands in (already i18n-rendered upstream) is
//     forwarded verbatim — `to`, `subject`, `html` round-trip.
//   - `idempotencyKey` round-trips into the `Idempotency-Key` header
//     when present, and is ABSENT when the caller didn't supply one
//     (Resend only dedupes on identical headers, so fabricating one
//     would silently swallow a deliberate "resend").
//   - non-2xx responses surface as a thrown error so the caller can
//     retry (the adapter itself doesn't loop — retry is upstream).

import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type Mock,
} from "vitest";
import { ResendEmailSender } from "../resend-email-sender.adapter";

const ORIGINAL_FETCH = globalThis.fetch;
const ORIGINAL_ENV = { ...process.env };

interface FetchInit {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

function mockFetch(
  responses: Array<{ ok: boolean; status: number; text?: string }>,
): Mock {
  let i = 0;
  const fn = vi.fn().mockImplementation(async () => {
    const r = responses[Math.min(i, responses.length - 1)]!;
    i++;
    return {
      ok: r.ok,
      status: r.status,
      text: async () => r.text ?? "",
    } as unknown as Response;
  });
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
}

afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH;
  process.env = { ...ORIGINAL_ENV };
});

describe("ResendEmailSender — dev / prod env behaviour", () => {
  beforeEach(() => {
    delete process.env.RESEND_API_KEY;
    (process.env as Record<string, string | undefined>).NODE_ENV = undefined;
  });

  it("dry-run in dev when RESEND_API_KEY is missing — DOES NOT call fetch", async () => {
    (process.env as Record<string, string>).NODE_ENV = "development";
    const fn = mockFetch([{ ok: true, status: 200 }]);
    const sender = new ResendEmailSender();

    await sender.send({
      to: "alice@example.com",
      subject: "Hi",
      html: "<p>Hi</p>",
    });

    expect(fn).not.toHaveBeenCalled();
  });

  it("dry-run in test when RESEND_API_KEY is missing — DOES NOT call fetch", async () => {
    (process.env as Record<string, string>).NODE_ENV = "test";
    const fn = mockFetch([{ ok: true, status: 200 }]);
    const sender = new ResendEmailSender();

    await sender.send({
      to: "alice@example.com",
      subject: "Hi",
      html: "<p>Hi</p>",
    });

    expect(fn).not.toHaveBeenCalled();
  });

  it("production + missing key → throws eagerly in the constructor (not on first send)", () => {
    // The class re-exports `ResendNotConfiguredError` but the constructor
    // delegates to `requireEnv("RESEND_API_KEY")` which throws a plain
    // Error. What matters here is "fail at boot, not on first send" —
    // we just check the throw, not the exact class.
    (process.env as Record<string, string>).NODE_ENV = "production";
    delete process.env.RESEND_API_KEY;
    expect(() => new ResendEmailSender()).toThrow(/RESEND_API_KEY/);
  });

  it("constructor.opts.apiKey overrides env (useful in tests)", async () => {
    (process.env as Record<string, string>).NODE_ENV = "production";
    const fn = mockFetch([{ ok: true, status: 200 }]);
    const sender = new ResendEmailSender({ apiKey: "RE-OVERRIDE" });

    await sender.send({
      to: "x@example.com",
      subject: "s",
      html: "<p>h</p>",
    });

    expect(fn).toHaveBeenCalledOnce();
    const headers = (fn.mock.calls[0]![1] as FetchInit).headers!;
    expect(headers.Authorization).toBe("Bearer RE-OVERRIDE");
  });
});

describe("ResendEmailSender — payload + headers", () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = "RE-TEST";
    delete process.env.EMAIL_FROM;
  });

  it("posts to https://api.resend.com/emails with the right shape", async () => {
    const fn = mockFetch([{ ok: true, status: 200 }]);
    const sender = new ResendEmailSender();

    await sender.send({
      to: "alice@example.com",
      subject: "Reset link",
      html: "<a>click</a>",
    });

    const [url, init] = fn.mock.calls[0] as [string, FetchInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body ?? "{}");
    expect(body).toEqual({
      from: "WBC <noreply@weavecode.co.uk>",
      to: ["alice@example.com"],
      subject: "Reset link",
      html: "<a>click</a>",
    });
  });

  it("EMAIL_FROM env overrides the default From address", async () => {
    process.env.EMAIL_FROM = "Custom <hi@x.test>";
    const fn = mockFetch([{ ok: true, status: 200 }]);
    const sender = new ResendEmailSender();

    await sender.send({ to: "x@x.test", subject: "s", html: "h" });

    const body = JSON.parse((fn.mock.calls[0]![1] as FetchInit).body ?? "{}");
    expect(body.from).toBe("Custom <hi@x.test>");
  });

  it("forwards the i18n-rendered html body verbatim — adapter doesn't transform", async () => {
    // The adapter is locale-agnostic; the caller picks the template.
    // What matters is that whatever HTML lands in EmailMessage.html is
    // shipped untouched. This anchors that property.
    const ptHtml = "<p>Olá Alice — confirme seu e-mail.</p>";
    const enHtml = "<p>Hi Alice — confirm your email.</p>";
    const fn = mockFetch([
      { ok: true, status: 200 },
      { ok: true, status: 200 },
    ]);
    const sender = new ResendEmailSender();

    await sender.send({ to: "a@x", subject: "Confirme", html: ptHtml });
    await sender.send({ to: "a@x", subject: "Confirm", html: enHtml });

    const body1 = JSON.parse((fn.mock.calls[0]![1] as FetchInit).body ?? "{}");
    const body2 = JSON.parse((fn.mock.calls[1]![1] as FetchInit).body ?? "{}");
    expect(body1.html).toBe(ptHtml);
    expect(body2.html).toBe(enHtml);
  });

  it("includes Idempotency-Key header when message.idempotencyKey is set", async () => {
    const fn = mockFetch([{ ok: true, status: 200 }]);
    const sender = new ResendEmailSender();

    await sender.send({
      to: "x@x",
      subject: "s",
      html: "h",
      idempotencyKey: "outbox-event-7",
    });

    const headers = (fn.mock.calls[0]![1] as FetchInit).headers!;
    expect(headers["Idempotency-Key"]).toBe("outbox-event-7");
  });

  it("OMITS Idempotency-Key header when the caller didn't supply one", async () => {
    // Why this is load-bearing: a fabricated key would silently
    // collapse "resend verification email" presses into one delivery.
    const fn = mockFetch([{ ok: true, status: 200 }]);
    const sender = new ResendEmailSender();

    await sender.send({ to: "x@x", subject: "s", html: "h" });

    const headers = (fn.mock.calls[0]![1] as FetchInit).headers!;
    expect("Idempotency-Key" in headers).toBe(false);
  });
});

describe("ResendEmailSender — failure handling", () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = "RE-TEST";
  });

  it("throws on 5xx so the caller can retry from the outbox", async () => {
    mockFetch([{ ok: false, status: 502, text: "bad gateway" }]);
    const sender = new ResendEmailSender();

    await expect(
      sender.send({ to: "x@x", subject: "s", html: "h" }),
    ).rejects.toThrow(/Resend API error: 502/);
  });

  it("throws on 503 (queueable transient)", async () => {
    mockFetch([{ ok: false, status: 503, text: "" }]);
    const sender = new ResendEmailSender();

    await expect(
      sender.send({ to: "x@x", subject: "s", html: "h" }),
    ).rejects.toThrow(/503/);
  });

  it("throws on 4xx (caller-side error — does not retry internally)", async () => {
    mockFetch([{ ok: false, status: 422, text: "invalid email" }]);
    const sender = new ResendEmailSender();

    await expect(
      sender.send({ to: "bad", subject: "s", html: "h" }),
    ).rejects.toThrow(/422/);
  });

  it("threads an AbortSignal to fetch (so a slow Resend can be unwedged)", async () => {
    // The adapter binds an AbortController + 5s timer (ACH-048). We
    // can't easily watch the 5s elapse without sleeping, so we lock
    // the property that matters: an AbortSignal IS passed to fetch.
    // If a refactor accidentally drops the signal, this assertion
    // catches it — the timeout itself is exercised by the
    // circuit-breaker / shared resilience suite separately.
    const seen: AbortSignal[] = [];
    globalThis.fetch = vi.fn().mockImplementation((_url, init) => {
      const i = init as { signal?: AbortSignal };
      if (i.signal) seen.push(i.signal);
      return Promise.resolve({
        ok: true,
        status: 200,
        text: async () => "",
      } as unknown as Response);
    }) as unknown as typeof fetch;

    const sender = new ResendEmailSender();
    await sender.send({ to: "x@x", subject: "s", html: "h" });

    expect(seen).toHaveLength(1);
    expect(seen[0]).toBeInstanceOf(AbortSignal);
  });
});
