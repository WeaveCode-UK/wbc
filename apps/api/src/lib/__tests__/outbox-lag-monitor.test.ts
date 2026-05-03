// Coverage gap: outbox-lag-monitor is the source of truth for the
// API's tRPC backpressure middleware. Two regressions hurt:
//   - missing the swallow on the prisma error path → a Postgres blip
//     turns into 500s on every request the middleware guards
//   - getOutboxLagAgeMs returning a finite (wrong) value before the
//     first sample → middleware thinks "lag is fresh and zero" when
//     it never actually polled, hiding a real outage
//
// The module owns three module-level vars (cachedLagMs, lastSampledAt,
// timer) — `vi.resetModules()` between tests gives us a clean slate.

import { describe, it, expect, vi, beforeEach } from "vitest";

const findFirstOutbox = vi.hoisted(() => vi.fn());

vi.mock("@wbc/db", () => ({
  prisma: {
    outboxEvent: { findFirst: findFirstOutbox },
  },
}));

beforeEach(() => {
  findFirstOutbox.mockReset();
  vi.resetModules();
});

describe("outbox-lag-monitor — initial state (cold)", () => {
  it("getOutboxLagMs returns 0 before any sample", async () => {
    const mod = await import("../outbox-lag-monitor");
    expect(mod.getOutboxLagMs()).toBe(0);
  });

  it("getOutboxLagAgeMs returns +Infinity when no sample has run", async () => {
    // Critical: the backpressure middleware reads age to decide
    // "is the cached value fresh enough to trust?". Returning 0 here
    // would make a never-polled monitor look like a permanently-fresh
    // zero-lag monitor — the worst kind of false negative.
    const mod = await import("../outbox-lag-monitor");
    expect(mod.getOutboxLagAgeMs()).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("outbox-lag-monitor — sampling", () => {
  it("startOutboxLagMonitor triggers an immediate sample (no need to wait for the interval)", async () => {
    findFirstOutbox.mockResolvedValue({
      createdAt: new Date(Date.now() - 1500),
    });
    const mod = await import("../outbox-lag-monitor");
    mod.startOutboxLagMonitor();
    // Immediate sample is async; let the microtask queue flush.
    await new Promise((r) => setImmediate(r));

    expect(findFirstOutbox).toHaveBeenCalledOnce();
    expect(mod.getOutboxLagMs()).toBeGreaterThanOrEqual(1500);
    expect(mod.getOutboxLagMs()).toBeLessThan(2500);
    mod.stopOutboxLagMonitor();
  });

  it("returns 0 lag when there are no unprocessed outbox rows", async () => {
    findFirstOutbox.mockResolvedValue(null);
    const mod = await import("../outbox-lag-monitor");
    mod.startOutboxLagMonitor();
    await new Promise((r) => setImmediate(r));

    expect(mod.getOutboxLagMs()).toBe(0);
    mod.stopOutboxLagMonitor();
  });

  it("swallows prisma errors (cached value preserved, no throw)", async () => {
    findFirstOutbox.mockRejectedValue(new Error("Postgres unreachable"));
    const mod = await import("../outbox-lag-monitor");
    mod.startOutboxLagMonitor();
    await new Promise((r) => setImmediate(r));

    // Lag stays at the cold default (0). The middleware's job is to
    // also check `getOutboxLagAgeMs()` and refuse to trust a stale
    // cache — but a thrown error here would crash the API process.
    expect(mod.getOutboxLagMs()).toBe(0);
    mod.stopOutboxLagMonitor();
  });
});

describe("outbox-lag-monitor — start/stop idempotency", () => {
  it("calling startOutboxLagMonitor twice does NOT create a second timer", async () => {
    findFirstOutbox.mockResolvedValue(null);
    const mod = await import("../outbox-lag-monitor");
    mod.startOutboxLagMonitor();
    mod.startOutboxLagMonitor(); // second call
    await new Promise((r) => setImmediate(r));

    // One immediate sample from the first start; the second start
    // returned early because `timer != null`. So findFirst was only
    // called ONCE (the immediate sample) regardless of how many
    // start calls happened.
    expect(findFirstOutbox).toHaveBeenCalledTimes(1);
    mod.stopOutboxLagMonitor();
  });

  it("stopOutboxLagMonitor before any start is a no-op (no throw)", async () => {
    const mod = await import("../outbox-lag-monitor");
    expect(() => mod.stopOutboxLagMonitor()).not.toThrow();
  });
});
