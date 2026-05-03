import { describe, it, expect } from "vitest";
import {
  createTimeoutSignal,
  DEFAULT_TIMEOUT_POLICY,
} from "../resilience/timeout";

// ACH-008. createTimeoutSignal hands out an AbortSignal that auto-aborts
// after timeoutMs. Caller must invoke `cancel` in `finally` to clear
// the timer when the operation completes early.

describe("DEFAULT_TIMEOUT_POLICY", () => {
  it("is 10 seconds (matches DEFAULT in resilience config)", () => {
    expect(DEFAULT_TIMEOUT_POLICY.timeoutMs).toBe(10_000);
  });
});

describe("createTimeoutSignal", () => {
  it("returns a non-aborted signal initially", () => {
    const { signal, cancel } = createTimeoutSignal({ timeoutMs: 1_000 });
    expect(signal.aborted).toBe(false);
    cancel();
  });

  it("aborts the signal after timeoutMs elapses", async () => {
    const { signal } = createTimeoutSignal({ timeoutMs: 20 });
    await new Promise((r) => setTimeout(r, 40));
    expect(signal.aborted).toBe(true);
  });

  it("cancel() prevents the abort from firing later", async () => {
    const { signal, cancel } = createTimeoutSignal({ timeoutMs: 20 });
    cancel();
    await new Promise((r) => setTimeout(r, 40));
    expect(signal.aborted).toBe(false);
  });

  it("falls back to DEFAULT_TIMEOUT_POLICY when no policy is provided", () => {
    // Smoke check — ensure the defaulted call shape returns a usable pair.
    const { signal, cancel } = createTimeoutSignal();
    expect(signal).toBeInstanceOf(AbortSignal);
    expect(typeof cancel).toBe("function");
    cancel();
  });
});
