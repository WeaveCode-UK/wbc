// T2.15 — circuit breaker timing + half-open semantics (CHECAGEM.md L614-620)
//
// `circuit-breaker.test.ts` already covers the happy path with real
// timers. This file complements it with FAKE-timer coverage for the
// state-machine edges that the wallclock-based test cannot pin
// deterministically:
//
//   - exact CLOSED → OPEN boundary (N-th consecutive failure flips it)
//   - while OPEN, fn is NOT invoked at all (no I/O leak under outage)
//   - cooldown elapsed → HALF_OPEN; before cooldown → still OPEN
//   - HALF_OPEN max-probes ceiling: extra calls reject without invoking fn
//   - failure during HALF_OPEN sends the breaker straight back to OPEN
//
// Fake timers also let us assert that `getState()` is the lazy
// transition trigger — the breaker doesn't need a background timer to
// move CLOSED → HALF_OPEN, which would be a leak in serverless/edge.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CircuitBreaker } from "../circuit-breaker";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("CircuitBreaker — failure-threshold boundary", () => {
  it("stays CLOSED at N-1 failures and flips to OPEN exactly on N", async () => {
    const cb = new CircuitBreaker("test", {
      failureThreshold: 3,
      resetTimeoutMs: 10_000,
      halfOpenMaxAttempts: 2,
    });

    for (let i = 0; i < 2; i++) {
      await cb.execute(
        async () => {
          throw new Error("fail");
        },
        () => "fb",
      );
    }
    expect(cb.getState()).toBe("CLOSED");

    await cb.execute(
      async () => {
        throw new Error("fail");
      },
      () => "fb",
    );
    expect(cb.getState()).toBe("OPEN");
  });
});

describe("CircuitBreaker — OPEN does not invoke fn", () => {
  it("rejects (or returns fallback) without calling the wrapped function", async () => {
    const cb = new CircuitBreaker("test", {
      failureThreshold: 1,
      resetTimeoutMs: 60_000,
      halfOpenMaxAttempts: 1,
    });

    await cb.execute(
      async () => {
        throw new Error("fail");
      },
      () => "fb",
    );
    expect(cb.getState()).toBe("OPEN");

    const fn = vi.fn().mockResolvedValue("never");
    const result = await cb.execute(fn, () => "fallback");

    expect(fn).not.toHaveBeenCalled();
    expect(result).toBe("fallback");
  });
});

describe("CircuitBreaker — cooldown boundary", () => {
  it("remains OPEN before the cooldown elapses", async () => {
    const cb = new CircuitBreaker("test", {
      failureThreshold: 1,
      resetTimeoutMs: 5_000,
      halfOpenMaxAttempts: 1,
    });

    await cb.execute(
      async () => {
        throw new Error("fail");
      },
      () => "fb",
    );
    vi.advanceTimersByTime(4_999);
    expect(cb.getState()).toBe("OPEN");
  });

  it("transitions to HALF_OPEN exactly at the cooldown boundary", async () => {
    const cb = new CircuitBreaker("test", {
      failureThreshold: 1,
      resetTimeoutMs: 5_000,
      halfOpenMaxAttempts: 1,
    });

    await cb.execute(
      async () => {
        throw new Error("fail");
      },
      () => "fb",
    );
    vi.advanceTimersByTime(5_000);
    expect(cb.getState()).toBe("HALF_OPEN");
  });
});

describe("CircuitBreaker — HALF_OPEN probe ceiling", () => {
  it("rejects extra probes once halfOpenMaxAttempts is reached", async () => {
    const cb = new CircuitBreaker("test", {
      failureThreshold: 1,
      resetTimeoutMs: 1_000,
      halfOpenMaxAttempts: 2,
    });

    // Open it, wait out cooldown to enter HALF_OPEN.
    await cb.execute(
      async () => {
        throw new Error("fail");
      },
      () => "fb",
    );
    vi.advanceTimersByTime(1_000);
    expect(cb.getState()).toBe("HALF_OPEN");

    // Two probes consume the budget without closing the circuit (we
    // hold them mid-flight by never resolving).
    const slow = (): Promise<string> => new Promise(() => {});
    void cb.execute(slow);
    void cb.execute(slow);

    // Third probe must short-circuit to fallback (or throw without fb).
    const fn = vi.fn().mockResolvedValue("won't run");
    const result = await cb.execute(fn, () => "fallback");
    expect(fn).not.toHaveBeenCalled();
    expect(result).toBe("fallback");
  });

  it("returns to OPEN after a HALF_OPEN failure", async () => {
    const cb = new CircuitBreaker("test", {
      failureThreshold: 1,
      resetTimeoutMs: 1_000,
      halfOpenMaxAttempts: 2,
    });

    await cb.execute(
      async () => {
        throw new Error("fail");
      },
      () => "fb",
    );
    vi.advanceTimersByTime(1_000);
    expect(cb.getState()).toBe("HALF_OPEN");

    await cb.execute(
      async () => {
        throw new Error("still failing");
      },
      () => "fb",
    );
    expect(cb.getState()).toBe("OPEN");
  });
});

describe("CircuitBreaker — recovery", () => {
  it("returns to CLOSED after a successful HALF_OPEN probe", async () => {
    const cb = new CircuitBreaker("test", {
      failureThreshold: 1,
      resetTimeoutMs: 1_000,
      halfOpenMaxAttempts: 1,
    });

    await cb.execute(
      async () => {
        throw new Error("fail");
      },
      () => "fb",
    );
    vi.advanceTimersByTime(1_000);

    const result = await cb.execute(async () => "recovered");
    expect(result).toBe("recovered");
    expect(cb.getState()).toBe("CLOSED");
  });

  it("never spawns background timers (lazy transition only)", () => {
    // Regression guard: a previous candidate impl used setTimeout to
    // schedule the OPEN→HALF_OPEN flip, which leaks in test runners
    // and serverless. The lazy `getState()` flip means zero pending
    // timers after `execute`.
    const cb = new CircuitBreaker("test", {
      failureThreshold: 1,
      resetTimeoutMs: 1_000,
      halfOpenMaxAttempts: 1,
    });
    void cb.execute(
      async () => {
        throw new Error("fail");
      },
      () => "fb",
    );
    expect(vi.getTimerCount()).toBe(0);
  });
});
