// T2.11 — idempotency wrapper (CHECAGEM.md L614-620)
//
// `idempotent(key, handler)` is the shield against tRPC retries replaying
// a mutation. The contract is small but every clause matters:
//   - cache hit → handler MUST NOT run; cached value is returned verbatim
//   - cache miss → handler runs once, result is stored under the key
//   - TTL expiry (Redis returns null again) → handler runs again
//   - missing key → handler runs every time (no read, no write)
//   - Redis outage → graceful degradation (handler still runs, no throw)
//
// We mock the Redis client at the module boundary because the middleware
// captures it lazily via `getRedis()` from `../lib/redis`. The fake
// preserves TTL semantics by tracking `expiresAt` per key and treating an
// expired entry as a miss — that's the cheapest faithful stand-in for
// `EX` without spinning up real Redis (the live test belongs in T5).

import { describe, it, expect, vi, beforeEach } from "vitest";

type Entry = { value: string; expiresAt: number };

function makeFakeRedis() {
  const store = new Map<string, Entry>();
  let now = 0;
  return {
    store,
    setNow: (t: number) => {
      now = t;
    },
    get: vi.fn(async (key: string) => {
      const entry = store.get(key);
      if (!entry) return null;
      if (entry.expiresAt <= now) {
        store.delete(key);
        return null;
      }
      return entry.value;
    }),
    set: vi.fn(
      async (key: string, value: string, _mode: "EX", duration: number) => {
        store.set(key, { value, expiresAt: now + duration * 1000 });
        return "OK";
      },
    ),
    flushall: () => store.clear(),
  };
}

const fakeRedis = makeFakeRedis();

vi.mock("../../lib/redis", () => ({
  getRedis: () => fakeRedis,
}));

import {
  idempotent,
  checkIdempotency,
  storeIdempotencyResult,
  deriveIdempotencyKey,
  resolveIdempotencyKey,
} from "../idempotency-middleware";

beforeEach(() => {
  fakeRedis.flushall();
  fakeRedis.get.mockClear();
  fakeRedis.set.mockClear();
  fakeRedis.setNow(Date.now());
});

describe("idempotent()", () => {
  it("invokes the handler on cache miss and stores the result", async () => {
    const handler = vi.fn().mockResolvedValue({ id: "sale-1" });
    const result = await idempotent("k1", handler);

    expect(handler).toHaveBeenCalledOnce();
    expect(result).toEqual({ id: "sale-1" });
    expect(fakeRedis.set).toHaveBeenCalledOnce();
  });

  it("returns the cached value on hit without re-running the handler", async () => {
    const first = vi.fn().mockResolvedValue({ id: "sale-1" });
    await idempotent("k1", first);

    const second = vi.fn().mockResolvedValue({ id: "should-not-run" });
    const result = await idempotent("k1", second);

    expect(second).not.toHaveBeenCalled();
    expect(result).toEqual({ id: "sale-1" });
  });

  it("re-executes the handler after the TTL window expires", async () => {
    fakeRedis.setNow(0);
    const first = vi.fn().mockResolvedValue("v1");
    await idempotent("k1", first);

    // Advance well past the 24h TTL — entry should be evicted on next read.
    fakeRedis.setNow(25 * 60 * 60 * 1000);

    const second = vi.fn().mockResolvedValue("v2");
    const result = await idempotent("k1", second);

    expect(second).toHaveBeenCalledOnce();
    expect(result).toBe("v2");
  });

  it("runs the handler every time when no key is provided", async () => {
    const handler = vi.fn().mockResolvedValue(1);
    await idempotent(undefined, handler);
    await idempotent(undefined, handler);

    expect(handler).toHaveBeenCalledTimes(2);
    expect(fakeRedis.get).not.toHaveBeenCalled();
    expect(fakeRedis.set).not.toHaveBeenCalled();
  });

  it("falls back to running the handler when the cache read throws", async () => {
    fakeRedis.get.mockRejectedValueOnce(new Error("redis down"));
    const handler = vi.fn().mockResolvedValue("ok");

    const result = await idempotent("k-broken", handler);

    expect(handler).toHaveBeenCalledOnce();
    expect(result).toBe("ok");
  });
});

describe("checkIdempotency / storeIdempotencyResult", () => {
  it("round-trips a complex object through JSON", async () => {
    await storeIdempotencyResult("rt", { items: [{ id: 1 }], total: 99.9 });
    const { isDuplicate, cachedResult } = await checkIdempotency("rt");
    expect(isDuplicate).toBe(true);
    expect(cachedResult).toEqual({ items: [{ id: 1 }], total: 99.9 });
  });
});

describe("deriveIdempotencyKey", () => {
  // The replacer-bug regression noted in the source — nested objects must
  // not collapse to {}. Two inventory orders with different items must
  // produce different keys.
  it("produces different keys for inputs that only differ deep inside", async () => {
    const a = deriveIdempotencyKey("inv.create", "t1", {
      items: [{ productName: "A", qty: 1 }],
    });
    const b = deriveIdempotencyKey("inv.create", "t1", {
      items: [{ productName: "B", qty: 1 }],
    });
    expect(a).not.toBe(b);
  });

  it("produces the same key regardless of top-level key order (canonicalised)", () => {
    const a = deriveIdempotencyKey("x", "t1", { a: 1, b: 2 });
    const b = deriveIdempotencyKey("x", "t1", { b: 2, a: 1 });
    expect(a).toBe(b);
  });
});

describe("resolveIdempotencyKey", () => {
  it("uses the caller-provided key verbatim when present", () => {
    const key = resolveIdempotencyKey("auth.accept", "t1", {
      idempotencyKey: "client-supplied-uuid",
    });
    expect(key).toBe("client-supplied-uuid");
  });

  it("derives a key when the caller omits one", () => {
    const key = resolveIdempotencyKey("auth.accept", "t1", { foo: 1 });
    expect(key.startsWith("auth.accept:t1:")).toBe(true);
  });

  // Coverage extension: branches not pinned by the original suite.

  it("derives a key when idempotencyKey is empty string (treats it as absent)", () => {
    // Some clients send `""` for "no key"; we must NOT use the empty
    // value verbatim (that would collide every empty-key call into a
    // single cache slot and dedupe unrelated requests).
    const key = resolveIdempotencyKey("x", "t1", { idempotencyKey: "" });
    expect(key.startsWith("x:t1:")).toBe(true);
  });

  it("derives a key when input is a primitive (no idempotencyKey on it)", () => {
    // Defensive: input could be a string/number from a non-object
    // mutation. The hash must still produce a stable, route-scoped key.
    const key = resolveIdempotencyKey("x", "t1", "raw-string");
    expect(key.startsWith("x:t1:")).toBe(true);
  });
});

describe("checkIdempotency — Redis read failure paths", () => {
  it("returns isDuplicate=false when Redis throws on get (not a double-call hazard)", async () => {
    fakeRedis.get.mockRejectedValueOnce(new Error("redis down"));
    const { isDuplicate } = await checkIdempotency("k1");
    // Graceful degradation — a Redis blip doesn't pretend a previous
    // run already happened. Worst case: the handler runs twice, which
    // the downstream DB constraints catch.
    expect(isDuplicate).toBe(false);
  });
});

describe("storeIdempotencyResult — Redis write failure paths", () => {
  it("does not throw when Redis fails — request still completes", async () => {
    fakeRedis.set.mockRejectedValueOnce(new Error("redis down"));
    await expect(
      storeIdempotencyResult("k1", { x: 1 }),
    ).resolves.toBeUndefined();
  });
});

describe("deriveIdempotencyKey — canonical form properties", () => {
  it("produces stable keys regardless of nested key order", () => {
    // The canonicaliser sorts keys at every nesting level. This is the
    // bug ACH-001 review-fix locks: nested objects used to collapse to {}.
    const a = deriveIdempotencyKey("inv.create", "t1", {
      meta: { z: 1, a: 2 },
      items: [{ qty: 1, productName: "X" }],
    });
    const b = deriveIdempotencyKey("inv.create", "t1", {
      items: [{ productName: "X", qty: 1 }],
      meta: { a: 2, z: 1 },
    });
    expect(a).toBe(b);
  });

  it("treats arrays as positional (order-sensitive)", () => {
    // Reordering items in a list IS a different mutation; keys must differ.
    const a = deriveIdempotencyKey("x", "t1", {
      items: [{ id: "A" }, { id: "B" }],
    });
    const b = deriveIdempotencyKey("x", "t1", {
      items: [{ id: "B" }, { id: "A" }],
    });
    expect(a).not.toBe(b);
  });

  it("scopes by tenantId (same input across tenants → different keys)", () => {
    const a = deriveIdempotencyKey("x", "t1", { foo: 1 });
    const b = deriveIdempotencyKey("x", "t2", { foo: 1 });
    expect(a).not.toBe(b);
  });

  it("scopes by route (same input across routes → different keys)", () => {
    const a = deriveIdempotencyKey("clients.create", "t1", { name: "A" });
    const b = deriveIdempotencyKey("clients.update", "t1", { name: "A" });
    expect(a).not.toBe(b);
  });
});
