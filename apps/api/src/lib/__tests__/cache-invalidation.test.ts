// Coverage gap: cache-invalidation maps domain → cache patterns. The
// dispatch table is ACH-007's whole reason to exist — every router that
// mutates calls `invalidateDomain('sales')` instead of remembering 4
// pattern strings. A regression in this map silently leaves cache
// stale; tests pin the contract so a "dashboard" pattern can't be
// dropped from `sales` by accident.
//
// We mock `./cache` so we can assert exactly which patterns get sent
// to `cacheInvalidatePatternForTenant` for each domain.

import { describe, it, expect, vi, beforeEach } from "vitest";

const { cacheInvalidatePatternForTenant } = vi.hoisted(() => ({
  cacheInvalidatePatternForTenant: vi.fn().mockResolvedValue(0),
}));

vi.mock("../cache", () => ({
  cacheInvalidatePatternForTenant,
}));

import { invalidateDomain, withCacheInvalidation } from "../cache-invalidation";

beforeEach(() => {
  cacheInvalidatePatternForTenant.mockClear().mockResolvedValue(0);
});

describe("invalidateDomain — dispatch table", () => {
  it.each([
    ["clients", ["clients:*", "analytics:dashboard", "analytics:clients:*"]],
    ["sales", ["sales:*", "analytics:dashboard", "analytics:sales:*"]],
    ["campaigns", ["campaigns:*", "analytics:dashboard"]],
    ["catalog", ["catalog:*", "catalog:public:*"]],
    ["inventory", ["inventory:*", "analytics:dashboard"]],
    ["finance", ["finance:*", "analytics:dashboard"]],
  ])(
    "%s → invalidates exactly the registered pattern set",
    async (domain, expectedPatterns: string[]) => {
      await invalidateDomain(domain);

      expect(cacheInvalidatePatternForTenant).toHaveBeenCalledTimes(
        expectedPatterns.length,
      );
      const called = cacheInvalidatePatternForTenant.mock.calls.map(
        (c) => c[0] as string,
      );
      // Order doesn't matter — Promise.all parallelises.
      for (const p of expectedPatterns) expect(called).toContain(p);
    },
  );

  it("does nothing on an unknown domain (no throw, no calls)", async () => {
    // The router guard is the source of truth for "valid domain". This
    // function just refuses to touch unrelated cache keys.
    await invalidateDomain("not-a-real-domain");
    expect(cacheInvalidatePatternForTenant).not.toHaveBeenCalled();
  });

  it("invalidates analytics:dashboard for every mutation domain (cross-cutting)", async () => {
    // Defensive: the dashboard pattern is the most-watched cache key in
    // the system. If a refactor accidentally drops it from a domain,
    // post-mutation reads stay stale until TTL.
    for (const d of ["clients", "sales", "campaigns", "inventory", "finance"]) {
      cacheInvalidatePatternForTenant.mockClear();
      await invalidateDomain(d);
      const patterns = cacheInvalidatePatternForTenant.mock.calls.map(
        (c) => c[0] as string,
      );
      expect(patterns).toContain("analytics:dashboard");
    }
  });
});

describe("withCacheInvalidation — fire-and-forget after mutation", () => {
  it("returns the wrapped fn's result", async () => {
    const result = await withCacheInvalidation("sales", async () => ({
      id: "sale-1",
    }));
    expect(result).toEqual({ id: "sale-1" });
  });

  it("triggers invalidation AFTER the mutation completes", async () => {
    let mutationDone = false;
    let invalidatedAfter = false;
    cacheInvalidatePatternForTenant.mockImplementation(async () => {
      // If invalidation ran before the mutation finished, mutationDone
      // would still be false here — that's the regression we guard.
      invalidatedAfter = mutationDone;
      return 0;
    });

    await withCacheInvalidation("sales", async () => {
      await Promise.resolve();
      mutationDone = true;
      return null;
    });

    // The invalidation is fire-and-forget; let the microtask queue flush.
    await new Promise((r) => setImmediate(r));
    expect(invalidatedAfter).toBe(true);
  });

  it("does NOT block the response when invalidation rejects", async () => {
    cacheInvalidatePatternForTenant.mockRejectedValue(new Error("redis down"));
    const result = await withCacheInvalidation("sales", async () => "ok");
    // The promise resolved without us awaiting the invalidation — the
    // logger.warn on rejection is the soft contract we're locking.
    expect(result).toBe("ok");
    // Drain the unhandled rejection sink.
    await new Promise((r) => setImmediate(r));
  });

  it("does not call invalidation when the wrapped fn throws (safe rollback)", async () => {
    // Rationale: invalidating cache before commit lands could create a
    // window where the cache is empty AND the DB is unchanged — racing
    // reads see neither. Throwing fns must not trigger invalidation.
    await expect(
      withCacheInvalidation("sales", async () => {
        throw new Error("sale failed");
      }),
    ).rejects.toThrow("sale failed");
    expect(cacheInvalidatePatternForTenant).not.toHaveBeenCalled();
  });
});
