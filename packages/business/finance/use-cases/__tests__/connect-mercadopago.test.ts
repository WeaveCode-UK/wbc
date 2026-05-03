// T2.7 — connectMercadoPago + disconnectMercadoPago + getMercadoPagoStatus
//
// OAuth handshake is server-to-server: code → access_token. We assert:
//   - missing client_id/secret env vars throw the typed error
//   - the POST to MP carries the right grant_type, code and redirect_uri
//   - HTTP non-2xx surfaces a Portuguese error (UI-facing)
//   - response without access_token / user_id is rejected
//   - access_token is persisted on the tenant row, never logged
//   - disconnect nullifies all 3 fields
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { updateTenant, findUniqueTenant } = vi.hoisted(() => ({
  updateTenant: vi.fn().mockResolvedValue(undefined),
  findUniqueTenant: vi.fn(),
}));

vi.mock("@wbc/db", () => ({
  prisma: {
    tenant: { update: updateTenant, findUnique: findUniqueTenant },
  },
}));

import {
  connectMercadoPago,
  disconnectMercadoPago,
  getMercadoPagoStatus,
  MercadoPagoOAuthNotConfiguredError,
} from "../connect-mercadopago";

const ORIGINAL_FETCH = globalThis.fetch;
const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  updateTenant.mockClear();
  findUniqueTenant.mockReset();
  process.env.MERCADOPAGO_CLIENT_ID = "test-client-id";
  process.env.MERCADOPAGO_CLIENT_SECRET = "test-client-secret";
});

afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH;
  process.env = { ...ORIGINAL_ENV };
});

function mockFetch(json: unknown, ok = true, status = 200) {
  const fn = vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => json,
    text: async () => JSON.stringify(json),
  } as unknown as Response);
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
}

describe("connectMercadoPago", () => {
  it("throws MercadoPagoOAuthNotConfiguredError when env vars are missing", async () => {
    delete process.env.MERCADOPAGO_CLIENT_ID;
    delete process.env.MERCADOPAGO_CLIENT_SECRET;
    await expect(
      connectMercadoPago("t1", "AUTH_CODE", "https://x/callback"),
    ).rejects.toBeInstanceOf(MercadoPagoOAuthNotConfiguredError);
  });

  it("posts grant_type=authorization_code with the supplied code + redirect_uri", async () => {
    const fetchMock = mockFetch({
      access_token: "AT-1",
      user_id: 12345,
      token_type: "bearer",
      expires_in: 600,
      scope: "read",
    });

    await connectMercadoPago("t1", "AUTH_CODE", "https://x/callback");

    expect(fetchMock).toHaveBeenCalledOnce();
    const call = fetchMock.mock.calls[0]!;
    const url = call[0] as string;
    const init = call[1] as { method: string; body: string };
    expect(url).toBe("https://api.mercadopago.com/oauth/token");
    expect(init.method).toBe("POST");
    expect(init.body).toContain("grant_type=authorization_code");
    expect(init.body).toContain("code=AUTH_CODE");
    expect(init.body).toContain(
      `redirect_uri=${encodeURIComponent("https://x/callback")}`,
    );
  });

  it("persists access_token + user_id on the tenant row", async () => {
    mockFetch({
      access_token: "AT-LIVE",
      user_id: 999,
      token_type: "bearer",
      expires_in: 600,
      scope: "read",
    });
    await connectMercadoPago("t1", "code", "https://x/callback");
    expect(updateTenant).toHaveBeenCalledWith({
      where: { id: "t1" },
      data: expect.objectContaining({
        mercadoPagoAccessToken: "AT-LIVE",
        mercadoPagoUserId: "999",
      }),
    });
  });

  it("surfaces a PT error message on HTTP non-2xx", async () => {
    mockFetch({ error: "invalid_grant" }, false, 400);
    await expect(
      connectMercadoPago("t1", "bad-code", "https://x/callback"),
    ).rejects.toThrow(/Falha na autorização Mercado Pago.*HTTP 400/);
  });

  it("rejects responses missing access_token", async () => {
    mockFetch({ user_id: 1, token_type: "bearer", expires_in: 600, scope: "" });
    await expect(
      connectMercadoPago("t1", "code", "https://x/callback"),
    ).rejects.toThrow(/sem access_token/);
  });

  it("rejects responses missing user_id", async () => {
    mockFetch({
      access_token: "AT-1",
      token_type: "bearer",
      expires_in: 600,
      scope: "",
    });
    await expect(
      connectMercadoPago("t1", "code", "https://x/callback"),
    ).rejects.toThrow(/sem access_token ou user_id/);
  });
});

describe("disconnectMercadoPago", () => {
  it("nullifies all 3 MP fields on the tenant", async () => {
    await disconnectMercadoPago("t1");
    expect(updateTenant).toHaveBeenCalledWith({
      where: { id: "t1" },
      data: {
        mercadoPagoAccessToken: null,
        mercadoPagoUserId: null,
        mercadoPagoConnectedAt: null,
      },
    });
  });
});

describe("getMercadoPagoStatus", () => {
  it("reports connected=true when access_token is present", async () => {
    findUniqueTenant.mockResolvedValue({
      mercadoPagoAccessToken: "AT-1",
      mercadoPagoUserId: "999",
      mercadoPagoConnectedAt: new Date("2026-05-01"),
    });
    const r = await getMercadoPagoStatus("t1");
    expect(r.connected).toBe(true);
    expect(r.userId).toBe("999");
  });

  it("reports connected=false when token is null", async () => {
    findUniqueTenant.mockResolvedValue({
      mercadoPagoAccessToken: null,
      mercadoPagoUserId: null,
      mercadoPagoConnectedAt: null,
    });
    const r = await getMercadoPagoStatus("t1");
    expect(r.connected).toBe(false);
    expect(r.userId).toBeNull();
  });

  it("does not leak the access_token in its return shape", async () => {
    findUniqueTenant.mockResolvedValue({
      mercadoPagoAccessToken: "AT-SECRET",
      mercadoPagoUserId: "1",
      mercadoPagoConnectedAt: new Date(),
    });
    const r = await getMercadoPagoStatus("t1");
    expect(JSON.stringify(r)).not.toContain("AT-SECRET");
  });
});
