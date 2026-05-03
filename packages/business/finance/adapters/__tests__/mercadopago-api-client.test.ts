// T3.4 — MercadoPago REST client (PIX charge creation + status read)
//
// Why this exists:
//   - The webhook is signed; the *outbound* call is idempotent. MP
//     dedupes on `X-Idempotency-Key`, which we set to our `txid`. If we
//     ever stop forwarding it, an outbox retry creates a duplicate
//     charge — silent in dev, expensive in prod.
//   - PIX is BRL with cents. MP's `transaction_amount` is a decimal
//     number, but we MUST emit it as a fixed-2 number (no float drift,
//     no scientific notation). The use-case computes from cents (int)
//     so this test checks the boundary where int-cents → 2-decimal-BRL
//     hands off to MP.
//   - When the API key is missing we throw a typed error instead of
//     hitting MP with a blank Bearer (which would 401 → look like flake).

import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type Mock,
} from "vitest";
import {
  createMpPixPayment,
  getMpPayment,
  MercadoPagoApiError,
  MercadoPagoNotConfiguredError,
} from "../mercadopago-api-client";

const ORIGINAL_FETCH = globalThis.fetch;
const ORIGINAL_ENV = { ...process.env };

interface FetchInit {
  method?: string;
  headers?: Headers;
  body?: string;
}

function mockFetch(
  responses: Array<{ ok: boolean; status: number; body: unknown }>,
): Mock {
  let i = 0;
  const fn = vi.fn().mockImplementation(async () => {
    const r = responses[Math.min(i, responses.length - 1)]!;
    i++;
    const text = typeof r.body === "string" ? r.body : JSON.stringify(r.body);
    return {
      ok: r.ok,
      status: r.status,
      text: async () => text,
    } as unknown as Response;
  });
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
}

beforeEach(() => {
  process.env.MERCADOPAGO_ACCESS_TOKEN = "TEST-ACCESS-TOKEN";
});

afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH;
  process.env = { ...ORIGINAL_ENV };
});

describe("createMpPixPayment", () => {
  it("throws MercadoPagoNotConfiguredError when access token is missing", async () => {
    delete process.env.MERCADOPAGO_ACCESS_TOKEN;
    await expect(
      createMpPixPayment({
        amount: 49.9,
        description: "Sale",
        txid: "tx-1",
      }),
    ).rejects.toBeInstanceOf(MercadoPagoNotConfiguredError);
  });

  it("posts to /v1/payments with payment_method_id=pix and the right Authorization", async () => {
    const fn = mockFetch([
      {
        ok: true,
        status: 201,
        body: {
          id: 999,
          status: "pending",
          point_of_interaction: {
            transaction_data: {
              qr_code: "QR",
              qr_code_base64: "QRB64",
              ticket_url: "https://mp/tu",
            },
          },
        },
      },
    ]);

    await createMpPixPayment({
      amount: 49.9,
      description: "Sale 1",
      txid: "tx-1",
    });

    const [url, init] = fn.mock.calls[0] as [string, FetchInit];
    expect(url).toBe("https://api.mercadopago.com/v1/payments");
    expect(init.method).toBe("POST");
    const headers = init.headers as Headers;
    expect(headers.get("authorization")).toBe("Bearer TEST-ACCESS-TOKEN");
    expect(headers.get("content-type")).toBe("application/json");
    const body = JSON.parse(init.body ?? "{}");
    expect(body.payment_method_id).toBe("pix");
    expect(body.description).toBe("Sale 1");
  });

  it("forwards txid as X-Idempotency-Key — outbox retries dedupe upstream", async () => {
    const fn = mockFetch([
      {
        ok: true,
        status: 201,
        body: { id: 1, status: "pending" },
      },
    ]);

    await createMpPixPayment({
      amount: 10.0,
      description: "x",
      txid: "STABLE-TXID-42",
    });

    const headers = (fn.mock.calls[0]![1] as FetchInit).headers as Headers;
    expect(headers.get("x-idempotency-key")).toBe("STABLE-TXID-42");
  });

  it("emits transaction_amount with 2-decimal precision (no float drift)", async () => {
    // 0.1 + 0.2 = 0.30000000000000004 in JS — toFixed(2) snaps to 0.30.
    const fn = mockFetch([
      {
        ok: true,
        status: 201,
        body: { id: 1, status: "pending" },
      },
    ]);

    await createMpPixPayment({
      amount: 0.1 + 0.2,
      description: "tip",
      txid: "tx-cents",
    });

    const body = JSON.parse((fn.mock.calls[0]![1] as FetchInit).body ?? "{}");
    expect(body.transaction_amount).toBe(0.3);
    // The serialized form must not contain a float-drift tail.
    expect((fn.mock.calls[0]![1] as FetchInit).body).not.toContain(
      "0.30000000000000004",
    );
  });

  it("encodes integer-BRL amounts (e.g. R$ 49) as 49, not 49.0 string", async () => {
    const fn = mockFetch([
      {
        ok: true,
        status: 201,
        body: { id: 1, status: "pending" },
      },
    ]);

    await createMpPixPayment({
      amount: 49,
      description: "round",
      txid: "tx-r",
    });

    const body = JSON.parse((fn.mock.calls[0]![1] as FetchInit).body ?? "{}");
    expect(body.transaction_amount).toBe(49);
    expect(typeof body.transaction_amount).toBe("number");
  });

  it("preserves cents precision for R$ 12.34 → 12.34 (not 12.339999…)", async () => {
    const fn = mockFetch([
      {
        ok: true,
        status: 201,
        body: { id: 1, status: "pending" },
      },
    ]);

    await createMpPixPayment({
      amount: 12.34,
      description: "x",
      txid: "tx-x",
    });

    const body = JSON.parse((fn.mock.calls[0]![1] as FetchInit).body ?? "{}");
    expect(body.transaction_amount).toBe(12.34);
  });

  it("surfaces MercadoPagoApiError with status + body on non-2xx", async () => {
    mockFetch([
      {
        ok: false,
        status: 400,
        body: { message: "invalid amount" },
      },
    ]);

    await expect(
      createMpPixPayment({
        amount: -1,
        description: "x",
        txid: "tx-bad",
      }),
    ).rejects.toMatchObject({
      name: "MercadoPagoApiError",
      status: 400,
    });
  });

  it("returns the gateway id coerced to string (MP sends int)", async () => {
    mockFetch([
      {
        ok: true,
        status: 201,
        body: {
          id: 1234567890123,
          status: "pending",
          point_of_interaction: {
            transaction_data: { qr_code: "Q", qr_code_base64: "B" },
          },
        },
      },
    ]);

    const r = await createMpPixPayment({
      amount: 10,
      description: "x",
      txid: "tx-x",
    });

    expect(r.id).toBe("1234567890123");
    expect(typeof r.id).toBe("string");
  });
});

describe("getMpPayment — payment_id idempotency lookup", () => {
  it("GETs /v1/payments/{id} and returns the canonical shape", async () => {
    const fn = mockFetch([
      {
        ok: true,
        status: 200,
        body: {
          id: 999,
          status: "approved",
          external_reference: "txid-abc",
          transaction_amount: 49.9,
        },
      },
    ]);

    const r = await getMpPayment("999");

    expect(fn.mock.calls[0]![0]).toBe(
      "https://api.mercadopago.com/v1/payments/999",
    );
    expect(r).toEqual({
      id: "999",
      status: "approved",
      externalReference: "txid-abc",
      amount: 49.9,
    });
  });

  it("URL-encodes the id (defends against accidental injection)", async () => {
    const fn = mockFetch([
      {
        ok: true,
        status: 200,
        body: { id: "x/y", status: "approved" },
      },
    ]);

    await getMpPayment("x/y");

    expect(fn.mock.calls[0]![0]).toBe(
      "https://api.mercadopago.com/v1/payments/x%2Fy",
    );
  });

  it("treats missing transaction_amount as 0 instead of NaN", async () => {
    mockFetch([
      {
        ok: true,
        status: 200,
        body: { id: 1, status: "pending" },
      },
    ]);

    const r = await getMpPayment("1");
    expect(r.amount).toBe(0);
  });

  it("throws MercadoPagoApiError on 404", async () => {
    mockFetch([{ ok: false, status: 404, body: { message: "not_found" } }]);

    await expect(getMpPayment("ghost")).rejects.toBeInstanceOf(
      MercadoPagoApiError,
    );
  });
});
