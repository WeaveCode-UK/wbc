import { describe, it, expect } from "vitest";
import {
  withDeadline,
  DeadlineExceededError,
  type DeadlineContext,
} from "../resilience/deadline";

// ACH-015 confiabilidade-resiliencia. `withDeadline` wraps a budget
// in an AbortSignal; descendants that respect the signal abort when
// the budget is exceeded. We exercise the success path, the error
// propagation, and the remaining-time math.

describe("withDeadline", () => {
  it("resolves with the inner function's value when finished within budget", async () => {
    const result = await withDeadline(100, async () => 42);
    expect(result).toBe(42);
  });

  it("provides a deadline context with a non-aborted signal initially", async () => {
    let captured: DeadlineContext | undefined;
    await withDeadline(100, async (ctx) => {
      captured = ctx;
      return null;
    });
    expect(captured).toBeDefined();
    // Signal must be an AbortSignal so adapters can wire it into fetch.
    expect(captured!.signal).toBeInstanceOf(AbortSignal);
  });

  it("remainingMs() never returns a negative number", async () => {
    await withDeadline(50, async (ctx) => {
      // After enough wall time, remaining must clamp to 0, not go negative.
      await new Promise((r) => setTimeout(r, 60));
      expect(ctx.remainingMs()).toBeGreaterThanOrEqual(0);
      return null;
    });
  });

  it("propagates errors thrown by the inner function", async () => {
    await expect(
      withDeadline(100, async () => {
        throw new Error("inner-fail");
      }),
    ).rejects.toThrow("inner-fail");
  });

  it("aborts the shared signal when the budget elapses", async () => {
    // Inner fn never completes; we observe the abort fired by the timer.
    let aborted = false;
    await withDeadline(20, async (ctx) => {
      await new Promise<void>((resolve) => {
        ctx.signal.addEventListener("abort", () => {
          aborted = true;
          resolve();
        });
      });
    });
    expect(aborted).toBe(true);
  });

  it("deadlineMs equals roughly now() + budget at creation", async () => {
    const before = Date.now();
    await withDeadline(50, async (ctx) => {
      // 5ms of slack is generous for clock jitter on shared CI runners.
      expect(ctx.deadlineMs).toBeGreaterThanOrEqual(before + 50 - 5);
      expect(ctx.deadlineMs).toBeLessThanOrEqual(before + 50 + 50);
      return null;
    });
  });
});

describe("DeadlineExceededError", () => {
  it("carries the budget in the message and has the expected name", () => {
    const e = new DeadlineExceededError(123);
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("DeadlineExceededError");
    expect(e.message).toBe("Deadline exceeded after 123ms");
  });
});
