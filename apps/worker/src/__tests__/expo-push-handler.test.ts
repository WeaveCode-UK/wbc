// T3.7 — Expo Push handler (apps/worker/src/processors/event-handlers.ts)
//
// The handler subscribes to NOTIFICATION_CREATED and POSTs an Expo Push
// payload to https://exp.host/--/api/v2/push/send. The lockable contract:
//   - one fan-out per registered PushDevice token for the tenant
//   - body shape matches Expo's docs: `to`, `title`, `body`, `data.type`,
//     `data.notificationId`, `sound: "default"`
//   - 502 / 503 → log + return (no crash, no token prune)
//   - DeviceNotRegistered → prune the matching token; OTHER errors → no-op
//
// We don't import the worker's index — we mock its dependencies, import
// the handler module, capture the subscribed callback, then invoke it
// directly. This sidesteps Redis / BullMQ entirely.

import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type Mock,
} from "vitest";

// `@wbc/db` is a singleton; the handler imports `{ prisma }`. Stub it.
const deleteMany = vi.fn().mockResolvedValue({ count: 0 });
vi.mock("@wbc/db", () => ({
  prisma: {
    pushDevice: { deleteMany },
    sale: { findFirst: vi.fn() },
  },
}));

// Stub `@wbc/shared` — keep `EVENTS` real (cheap constant) but
// hijack `subscribe` so we can capture the handler.
const subscribers = new Map<string, (event: unknown) => Promise<void>>();
vi.mock("@wbc/shared", async (importOriginal) => {
  const original = await importOriginal<typeof import("@wbc/shared")>();
  return {
    ...original,
    subscribe: (type: string, handler: (event: unknown) => Promise<void>) => {
      subscribers.set(type, handler);
    },
  };
});

// Stub the listPushTokensForTenant use-case — what comes back drives
// fan-out cardinality.
const listPushTokensForTenant = vi.fn();
vi.mock("@wbc/business/platform/use-cases/manage-push-devices", () => ({
  listPushTokensForTenant: (...args: unknown[]) =>
    listPushTokensForTenant(...args),
}));

// Stub loyalty too — registerLoyaltyHandler is invoked at import time
// in some setups; we just want it to be a no-op to keep this test
// scoped to push.
vi.mock("@wbc/business/loyalty/adapters/prisma-loyalty-repository", () => ({
  PrismaLoyaltyRepository: class {},
}));
vi.mock("@wbc/business/loyalty/use-cases/manage-loyalty", () => ({
  earnFromSale: vi.fn(),
}));

const ORIGINAL_FETCH = globalThis.fetch;

interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  data: { type: string; notificationId: string };
  sound: string;
}

interface FetchInit {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

function mockFetch(
  responses: Array<{ ok: boolean; status: number; body?: unknown }>,
): Mock {
  let i = 0;
  const fn = vi.fn().mockImplementation(async () => {
    const r = responses[Math.min(i, responses.length - 1)]!;
    i++;
    return {
      ok: r.ok,
      status: r.status,
      json: async () => r.body ?? { data: [] },
    } as unknown as Response;
  });
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
}

beforeEach(() => {
  subscribers.clear();
  deleteMany.mockClear();
  listPushTokensForTenant.mockReset();
});

afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH;
});

async function loadHandler(): Promise<(event: unknown) => Promise<void>> {
  vi.resetModules();
  const mod = await import("../processors/event-handlers");
  mod.registerNotificationPushHandler();
  const handler = subscribers.get("notification.created");
  if (!handler) throw new Error("notification.created handler not registered");
  return handler;
}

const baseEvent = {
  id: "evt-1",
  type: "notification.created",
  tenantId: "t-1",
  payload: {
    notificationId: "n-1",
    tenantId: "t-1",
    title: "Você recebeu uma mensagem",
    body: "Toque para abrir",
    type: "campaign",
  },
};

describe("expo-push handler — payload shape", () => {
  it("posts the Expo Push payload to exp.host with the documented shape", async () => {
    listPushTokensForTenant.mockResolvedValue([
      { token: "ExponentPushToken[abc]" },
      { token: "ExponentPushToken[def]" },
    ]);
    const fn = mockFetch([
      {
        ok: true,
        status: 200,
        body: { data: [{ status: "ok" }, { status: "ok" }] },
      },
    ]);
    const handler = await loadHandler();

    await handler(baseEvent);

    expect(fn).toHaveBeenCalledOnce();
    const [url, init] = fn.mock.calls[0] as [string, FetchInit];
    expect(url).toBe("https://exp.host/--/api/v2/push/send");
    expect(init.method).toBe("POST");
    expect(init.headers?.["Content-Type"]).toBe("application/json");
    expect(init.headers?.Accept).toBe("application/json");

    const body = JSON.parse(init.body ?? "[]") as ExpoMessage[];
    expect(body).toHaveLength(2);
    expect(body[0]).toEqual({
      to: "ExponentPushToken[abc]",
      title: "Você recebeu uma mensagem",
      body: "Toque para abrir",
      data: { type: "campaign", notificationId: "n-1" },
      sound: "default",
    });
    expect(body[1]?.to).toBe("ExponentPushToken[def]");
  });

  it("does NOT call fetch when there are no registered tokens for the tenant", async () => {
    listPushTokensForTenant.mockResolvedValue([]);
    const fn = mockFetch([{ ok: true, status: 200 }]);
    const handler = await loadHandler();

    await handler(baseEvent);

    expect(fn).not.toHaveBeenCalled();
  });

  it("ignores events missing tenantId / notificationId (defensive)", async () => {
    const fn = mockFetch([{ ok: true, status: 200 }]);
    const handler = await loadHandler();

    await handler({
      id: "evt-x",
      type: "notification.created",
      tenantId: "t-1",
      payload: {},
    });

    expect(fn).not.toHaveBeenCalled();
    expect(listPushTokensForTenant).not.toHaveBeenCalled();
  });
});

describe("expo-push handler — failure handling (502 / 503 / errors)", () => {
  it("does NOT throw on 502 (Expo bad gateway)", async () => {
    listPushTokensForTenant.mockResolvedValue([{ token: "t1" }]);
    mockFetch([{ ok: false, status: 502 }]);
    const handler = await loadHandler();

    // The contract is: log + return. The outbox dispatcher is
    // responsible for retry policy; the handler must not blow up.
    await expect(handler(baseEvent)).resolves.toBeUndefined();
    expect(deleteMany).not.toHaveBeenCalled();
  });

  it("does NOT throw on 503 (Expo overloaded)", async () => {
    listPushTokensForTenant.mockResolvedValue([{ token: "t1" }]);
    mockFetch([{ ok: false, status: 503 }]);
    const handler = await loadHandler();

    await expect(handler(baseEvent)).resolves.toBeUndefined();
    expect(deleteMany).not.toHaveBeenCalled();
  });

  it("swallows network errors so a single bad batch doesn't kill the worker", async () => {
    listPushTokensForTenant.mockResolvedValue([{ token: "t1" }]);
    globalThis.fetch = vi
      .fn()
      .mockRejectedValue(new Error("ECONNRESET")) as unknown as typeof fetch;
    const handler = await loadHandler();

    await expect(handler(baseEvent)).resolves.toBeUndefined();
  });
});

describe("expo-push handler — DeviceNotRegistered prune", () => {
  it("deletes ONLY the tokens Expo flagged as DeviceNotRegistered", async () => {
    listPushTokensForTenant.mockResolvedValue([
      { token: "good-token" },
      { token: "stale-token" },
      { token: "rate-limited-token" },
    ]);
    mockFetch([
      {
        ok: true,
        status: 200,
        body: {
          data: [
            { status: "ok" },
            { status: "error", details: { error: "DeviceNotRegistered" } },
            { status: "error", details: { error: "MessageRateExceeded" } },
          ],
        },
      },
    ]);
    const handler = await loadHandler();

    await handler(baseEvent);

    // Why exactly once: rate-limit errors are transient and pruning
    // them would lock out reachable devices. Only DeviceNotRegistered
    // is a hard "this device is gone" signal.
    expect(deleteMany).toHaveBeenCalledTimes(1);
    expect(deleteMany).toHaveBeenCalledWith({
      where: { token: "stale-token" },
    });
  });

  it("does not prune anything when every status is `ok`", async () => {
    listPushTokensForTenant.mockResolvedValue([{ token: "t1" }]);
    mockFetch([
      {
        ok: true,
        status: 200,
        body: { data: [{ status: "ok" }] },
      },
    ]);
    const handler = await loadHandler();

    await handler(baseEvent);

    expect(deleteMany).not.toHaveBeenCalled();
  });
});
