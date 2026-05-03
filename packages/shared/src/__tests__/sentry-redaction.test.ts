// T3.8 — Sentry event redaction (`sentry-redaction.ts`)
//
// This is the last line of defence before PII (email, phone, CPF) and
// secrets (access tokens, cookies) leave the platform for Sentry.io
// (US-hosted, ACH-008 compliance-privacidade). The redactor is keyed on
// field names so we test:
//   - every documented sensitive key is replaced with "[redacted]"
//   - matching is case-insensitive (Sentry SDK lowercases some headers)
//   - matching is recursive — keys inside `request.headers`, `extra`,
//     `contexts`, `breadcrumbs` are reached
//   - non-sensitive fields are preserved verbatim
//   - bottomless / circular-ish payloads bottom out (depth guard)
//   - giant strings are truncated so a 50KB body doesn't end up in Sentry

import { describe, it, expect } from "vitest";
import { redactSentryEvent } from "../sentry-redaction";

describe("redactSentryEvent — top-level fields", () => {
  it("strips request.headers.authorization", () => {
    const out = redactSentryEvent({
      request: {
        url: "https://x/y",
        headers: {
          authorization: "Bearer secret-jwt-1",
          "user-agent": "ok",
        },
      },
    });
    expect(
      (out as { request: { headers: Record<string, string> } }).request.headers
        .authorization,
    ).toBe("[redacted]");
    expect(
      (out as { request: { headers: Record<string, string> } }).request.headers[
        "user-agent"
      ],
    ).toBe("ok");
  });

  it("strips request.headers.cookie + set-cookie", () => {
    const out = redactSentryEvent({
      request: {
        headers: {
          cookie: "session=secret",
          "set-cookie": "csrf=secret",
        },
      },
    });
    const headers = (out as { request: { headers: Record<string, string> } })
      .request.headers;
    expect(headers.cookie).toBe("[redacted]");
    expect(headers["set-cookie"]).toBe("[redacted]");
  });

  it("strips user.email and user.ip_address", () => {
    const out = redactSentryEvent({
      user: {
        id: "u-1",
        email: "alice@example.com",
        ip_address: "10.0.0.1",
      },
    });
    expect((out as { user: Record<string, unknown> }).user).toEqual({
      id: "u-1",
    });
  });
});

describe("redactSentryEvent — sensitive keys (PII / secrets)", () => {
  // Every documented key in SENSITIVE_KEYS_RE — one assertion per key
  // so a regex regression points at the field that broke.
  const cases: Array<[string, unknown]> = [
    ["password", "p@ss"],
    ["token", "tok"],
    ["access_token", "AT"],
    ["refresh_token", "RT"],
    ["id_token", "IT"],
    ["secret", "s"],
    ["api_key", "k"],
    ["api-key", "k"],
    ["apikey", "k"],
    ["otp", "123456"],
    ["email", "alice@example.com"],
    ["phone", "+5511999990000"],
    ["phone_number", "+5511999990000"],
    ["phonenumber", "+5511999990000"],
    ["telefone", "+5511999990000"],
    ["whatsapp", "+5511999990000"],
    ["whatsapp_id", "wa-x"],
    ["cpf", "123.456.789-00"],
    ["cnpj", "12.345.678/0001-90"],
    ["allergies", "amendoim"],
    ["notes", "tem alergia"],
    ["preferences", "perfume floral"],
  ];

  it.each(cases)("redacts `%s` in request.headers", (key, value) => {
    const out = redactSentryEvent({
      request: { headers: { [key]: value } },
    });
    expect(
      (out as { request: { headers: Record<string, unknown> } }).request
        .headers[key],
    ).toBe("[redacted]");
  });

  it("matches case-insensitively (Authorization vs authorization)", () => {
    const out = redactSentryEvent({
      request: {
        headers: {
          Authorization: "Bearer x",
          AUTHORIZATION: "Bearer x",
          PASSWORD: "p",
          Email: "alice@example.com",
        },
      },
    });
    const headers = (out as { request: { headers: Record<string, string> } })
      .request.headers;
    expect(headers.Authorization).toBe("[redacted]");
    expect(headers.AUTHORIZATION).toBe("[redacted]");
    expect(headers.PASSWORD).toBe("[redacted]");
    expect(headers.Email).toBe("[redacted]");
  });
});

describe("redactSentryEvent — partial-match for nested objects", () => {
  it("redacts sensitive keys nested inside `extra`", () => {
    const out = redactSentryEvent({
      extra: {
        purchase: {
          orderId: "o-1",
          customer: { name: "Alice", email: "alice@example.com" },
        },
      },
    });
    const purchase = (
      out as {
        extra: { purchase: { customer: Record<string, unknown> } };
      }
    ).extra.purchase;
    expect(purchase.customer).toEqual({
      name: "Alice",
      email: "[redacted]",
    });
  });

  it("redacts sensitive keys nested inside `contexts`", () => {
    const out = redactSentryEvent({
      contexts: {
        session: { id: "s-1", phone: "+5511999990000" },
      },
    });
    const session = (out as { contexts: { session: Record<string, unknown> } })
      .contexts.session;
    expect(session.id).toBe("s-1");
    expect(session.phone).toBe("[redacted]");
  });

  it("redacts sensitive keys inside breadcrumbs[].data", () => {
    const out = redactSentryEvent({
      breadcrumbs: [
        {
          category: "http",
          data: {
            url: "https://x/y",
            authorization: "Bearer x",
          },
        },
        {
          category: "auth",
          data: { user_id: "u-1", password: "p" },
        },
      ],
    });
    const crumbs = (
      out as {
        breadcrumbs: Array<{ data: Record<string, unknown> }>;
      }
    ).breadcrumbs;
    expect(crumbs[0]!.data.authorization).toBe("[redacted]");
    expect(crumbs[1]!.data.password).toBe("[redacted]");
  });

  it("redacts sensitive keys inside arrays of objects", () => {
    const out = redactSentryEvent({
      extra: {
        recipients: [
          { name: "Alice", phone: "+55 1" },
          { name: "Bob", cpf: "123.456.789-00" },
        ],
      },
    });
    const recipients = (
      out as {
        extra: { recipients: Array<Record<string, unknown>> };
      }
    ).extra.recipients;
    expect(recipients[0]).toEqual({ name: "Alice", phone: "[redacted]" });
    expect(recipients[1]).toEqual({ name: "Bob", cpf: "[redacted]" });
  });

  it("preserves non-sensitive sibling fields untouched", () => {
    const out = redactSentryEvent({
      extra: {
        order: { id: "o-1", total: 49.9, currency: "BRL" },
      },
    });
    expect((out as { extra: { order: unknown } }).extra.order).toEqual({
      id: "o-1",
      total: 49.9,
      currency: "BRL",
    });
  });
});

describe("redactSentryEvent — defensive boundaries", () => {
  it("returns null / non-object events untouched", () => {
    expect(redactSentryEvent(null)).toBe(null);
    expect(redactSentryEvent(undefined)).toBe(undefined);
    expect(redactSentryEvent("string")).toBe("string");
    expect(redactSentryEvent(42)).toBe(42);
  });

  it("bottom-stops at depth 6 (no infinite recursion on cycles)", () => {
    // Build a 10-level-deep object — anything past 6 should be replaced.
    type N = { phone?: string; n?: N };
    const deep: N = {};
    let cur = deep;
    for (let i = 0; i < 10; i++) {
      cur.n = {};
      cur = cur.n;
    }
    cur.phone = "+5511999990000";

    // Doesn't throw, returns SOMETHING — that's the contract. The
    // intermediate "[redacted-depth]" sentinel proves the guard fired.
    const out = redactSentryEvent({ extra: deep });
    expect(JSON.stringify(out)).toContain("[redacted-depth]");
  });

  it("truncates strings longer than MAX_STRING_LEN (2000)", () => {
    const long = "x".repeat(3000);
    const out = redactSentryEvent({ extra: { dump: long } });
    const dump = (out as { extra: { dump: string } }).extra.dump;
    expect(dump.length).toBeLessThan(3000);
    expect(dump).toContain("[truncated]");
  });

  it("does NOT truncate strings under MAX_STRING_LEN", () => {
    const ok = "y".repeat(100);
    const out = redactSentryEvent({ extra: { dump: ok } });
    expect((out as { extra: { dump: string } }).extra.dump).toBe(ok);
  });

  it("preserves null values inside nested objects", () => {
    const out = redactSentryEvent({
      extra: { value: null, count: 0 },
    });
    expect((out as { extra: { value: unknown; count: number } }).extra).toEqual(
      {
        value: null,
        count: 0,
      },
    );
  });
});
