// T3.4 — Mercado Pago webhook signature + payload parsing
//
// MP signs each webhook with `x-signature: ts=...,v1=hmac(...)` over the
// template `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`. The bytes
// must be compared in constant time and any single-byte mutation has to
// reject. The parser is the only thing that turns MP's raw body into
// something the use-case can consume — the `data.id` (a payment_id)
// drives downstream idempotency, so the parser must coerce it to string
// regardless of whether MP sends it as int or string (they do both).

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createHmac } from "crypto";
import {
  MercadoPagoWebhookSignatureError,
  MercadoPagoWebhookNotConfiguredError,
  parseMercadoPagoPayload,
  verifyMercadoPagoSignature,
} from "../mercadopago-webhook-handler";

const SECRET = "mp-test-secret";
const REQUEST_ID = "mp-req-1";
const DATA_ID = "12345678";

function makeSignature(opts?: { ts?: string; secret?: string }): string {
  const ts = opts?.ts ?? "1700000000";
  const secret = opts?.secret ?? SECRET;
  const template = `id:${DATA_ID};request-id:${REQUEST_ID};ts:${ts};`;
  const v1 = createHmac("sha256", secret).update(template).digest("hex");
  return `ts=${ts},v1=${v1}`;
}

beforeEach(() => {
  process.env.MERCADOPAGO_WEBHOOK_SECRET = SECRET;
});

afterEach(() => {
  delete process.env.MERCADOPAGO_WEBHOOK_SECRET;
});

describe("verifyMercadoPagoSignature", () => {
  it("accepts a valid ts=...,v1=<hmac>", () => {
    expect(() =>
      verifyMercadoPagoSignature({
        rawBody: "{}",
        signatureHeader: makeSignature(),
        requestIdHeader: REQUEST_ID,
        dataId: DATA_ID,
      }),
    ).not.toThrow();
  });

  it("rejects when secret env var is missing", () => {
    delete process.env.MERCADOPAGO_WEBHOOK_SECRET;
    expect(() =>
      verifyMercadoPagoSignature({
        rawBody: "{}",
        signatureHeader: makeSignature(),
        requestIdHeader: REQUEST_ID,
        dataId: DATA_ID,
      }),
    ).toThrowError(MercadoPagoWebhookNotConfiguredError);
  });

  it("rejects when signature header is missing", () => {
    expect(() =>
      verifyMercadoPagoSignature({
        rawBody: "{}",
        signatureHeader: undefined,
        requestIdHeader: REQUEST_ID,
        dataId: DATA_ID,
      }),
    ).toThrowError(MercadoPagoWebhookSignatureError);
  });

  it("rejects when request-id header is missing", () => {
    expect(() =>
      verifyMercadoPagoSignature({
        rawBody: "{}",
        signatureHeader: makeSignature(),
        requestIdHeader: undefined,
        dataId: DATA_ID,
      }),
    ).toThrowError(MercadoPagoWebhookSignatureError);
  });

  it("rejects when dataId is missing", () => {
    expect(() =>
      verifyMercadoPagoSignature({
        rawBody: "{}",
        signatureHeader: makeSignature(),
        requestIdHeader: REQUEST_ID,
        dataId: undefined,
      }),
    ).toThrowError(MercadoPagoWebhookSignatureError);
  });

  it("rejects a header that has ts but no v1", () => {
    expect(() =>
      verifyMercadoPagoSignature({
        rawBody: "{}",
        signatureHeader: "ts=1700000000",
        requestIdHeader: REQUEST_ID,
        dataId: DATA_ID,
      }),
    ).toThrowError(MercadoPagoWebhookSignatureError);
  });

  it("rejects when v1 hmac is signed with the wrong secret", () => {
    expect(() =>
      verifyMercadoPagoSignature({
        rawBody: "{}",
        signatureHeader: makeSignature({ secret: "wrong-secret" }),
        requestIdHeader: REQUEST_ID,
        dataId: DATA_ID,
      }),
    ).toThrowError(MercadoPagoWebhookSignatureError);
  });

  it("rejects when ts in header doesn't match what was signed (different template input)", () => {
    // Sig says ts=1700000000 but we then change ts on the header — the
    // template recomputes with ts=1700000999 and the hmac mismatches.
    const sig = makeSignature({ ts: "1700000000" });
    const tampered = sig.replace("ts=1700000000", "ts=1700000999");
    expect(() =>
      verifyMercadoPagoSignature({
        rawBody: "{}",
        signatureHeader: tampered,
        requestIdHeader: REQUEST_ID,
        dataId: DATA_ID,
      }),
    ).toThrowError(MercadoPagoWebhookSignatureError);
  });

  it("rejects when dataId differs from the one used to sign", () => {
    expect(() =>
      verifyMercadoPagoSignature({
        rawBody: "{}",
        signatureHeader: makeSignature(),
        requestIdHeader: REQUEST_ID,
        dataId: "different-payment-id",
      }),
    ).toThrowError(MercadoPagoWebhookSignatureError);
  });

  it("rejects every single-byte mutation of v1 (fuzz)", () => {
    const sig = makeSignature();
    const v1Index = sig.indexOf("v1=") + 3;
    for (let i = v1Index; i < sig.length; i++) {
      const ch = sig[i]!;
      const mutated =
        sig.slice(0, i) + (ch === "0" ? "1" : "0") + sig.slice(i + 1);
      expect(() =>
        verifyMercadoPagoSignature({
          rawBody: "{}",
          signatureHeader: mutated,
          requestIdHeader: REQUEST_ID,
          dataId: DATA_ID,
        }),
      ).toThrowError(MercadoPagoWebhookSignatureError);
    }
  });
});

describe("parseMercadoPagoPayload — idempotency by payment_id", () => {
  it("coerces numeric data.id (MP sends int) into a string", () => {
    const parsed = parseMercadoPagoPayload({
      action: "payment.updated",
      data: { id: 12345678 },
      type: "payment",
    });
    // Why string: the use-case keys the idempotent upsert by data.id,
    // and a tenant column comparing String(int) === String(string)
    // would silently miss — Prisma's where compares strict types.
    expect(parsed.data?.id).toBe("12345678");
    expect(typeof parsed.data?.id).toBe("string");
  });

  it("preserves data.id when MP sends it as a string", () => {
    const parsed = parseMercadoPagoPayload({
      data: { id: "abc-123" },
      type: "payment",
    });
    expect(parsed.data?.id).toBe("abc-123");
  });

  it("returns {} when payload is not an object", () => {
    expect(parseMercadoPagoPayload(null)).toEqual({});
    expect(parseMercadoPagoPayload(undefined)).toEqual({});
    expect(parseMercadoPagoPayload("string")).toEqual({});
  });

  it("ignores non-string fields rather than coercing silently", () => {
    const parsed = parseMercadoPagoPayload({
      action: 12, // wrong type — must be dropped, not coerced
      type: "payment",
      live_mode: true,
    });
    expect(parsed.action).toBeUndefined();
    expect(parsed.type).toBe("payment");
    expect(parsed.live_mode).toBe(true);
  });
});
