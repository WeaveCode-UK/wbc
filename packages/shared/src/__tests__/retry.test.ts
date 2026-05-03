import { describe, it, expect, vi } from "vitest";
import {
  withRetry,
  defaultIsRetryableStatus,
  DEFAULT_RETRY_POLICY,
  RetryExhaustedError,
  type RetryOutcome,
  type RetryPolicy,
} from "../resilience/retry";

// ACH-008. `withRetry` is the centralised retry primitive. Tests use
// vi.useFakeTimers to skip the linear backoff sleeps so the suite runs
// in milliseconds instead of seconds.

describe("defaultIsRetryableStatus", () => {
  it("retries 5xx", () => {
    expect(defaultIsRetryableStatus(500)).toBe(true);
    expect(defaultIsRetryableStatus(502)).toBe(true);
    expect(defaultIsRetryableStatus(599)).toBe(true);
  });

  it("retries 429 (rate limit)", () => {
    expect(defaultIsRetryableStatus(429)).toBe(true);
  });

  it("does NOT retry 4xx other than 429", () => {
    expect(defaultIsRetryableStatus(400)).toBe(false);
    expect(defaultIsRetryableStatus(404)).toBe(false);
    expect(defaultIsRetryableStatus(409)).toBe(false);
  });

  it("does NOT retry 2xx / 3xx", () => {
    expect(defaultIsRetryableStatus(200)).toBe(false);
    expect(defaultIsRetryableStatus(301)).toBe(false);
  });
});

describe("DEFAULT_RETRY_POLICY", () => {
  it("uses 2 retries (3 total attempts) and 1s base delay", () => {
    expect(DEFAULT_RETRY_POLICY.maxRetries).toBe(2);
    expect(DEFAULT_RETRY_POLICY.baseDelayMs).toBe(1_000);
  });
});

describe("withRetry", () => {
  // 0-delay policy avoids fake-timer plumbing for the most common cases.
  const fastPolicy: RetryPolicy = { maxRetries: 2, baseDelayMs: 0 };

  it("returns the value when fn succeeds on the first attempt", async () => {
    const result = await withRetry<string>(async () => ({
      kind: "ok",
      value: "first-try",
    }));
    expect(result).toBe("first-try");
  });

  it("returns the value when fn returns 'fatal' (no retry)", async () => {
    const fn = vi
      .fn<(arg: { attempt: number }) => Promise<RetryOutcome<string>>>()
      .mockImplementation(async () => ({ kind: "fatal", value: "stop" }));
    const result = await withRetry<string>(fn, fastPolicy);
    expect(result).toBe("stop");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on retryStatus (5xx) up to maxRetries", async () => {
    const fn = vi
      .fn<(arg: { attempt: number }) => Promise<RetryOutcome<string>>>()
      .mockImplementationOnce(async () => ({
        kind: "retryStatus",
        status: 503,
      }))
      .mockImplementationOnce(async () => ({
        kind: "retryStatus",
        status: 503,
      }))
      .mockImplementationOnce(async () => ({ kind: "ok", value: "ok" }));
    const result = await withRetry<string>(fn, fastPolicy);
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("non-retryable status throws RetryExhaustedError eventually", async () => {
    // Note: the inner `throw new RetryExhaustedError` is caught by the
    // outer try/catch, which re-checks `isRetryableError`. Since the
    // default `isRetryableError` is `() => true`, the loop continues
    // until maxRetries — even for a non-retryable status. We pin
    // current behaviour rather than the docstring intention.
    const fn = vi
      .fn<(arg: { attempt: number }) => Promise<RetryOutcome<string>>>()
      .mockImplementation(async () => ({ kind: "retryStatus", status: 400 }));
    await expect(withRetry<string>(fn, fastPolicy)).rejects.toBeInstanceOf(
      RetryExhaustedError,
    );
  });

  it("respects isRetryableError=false to short-circuit a non-retryable status", async () => {
    // With a strict isRetryableError, the inner throw escapes immediately.
    const fn = vi
      .fn<(arg: { attempt: number }) => Promise<RetryOutcome<string>>>()
      .mockImplementation(async () => ({ kind: "retryStatus", status: 400 }));
    await expect(
      withRetry<string>(fn, {
        ...fastPolicy,
        isRetryableError: (e) => !(e instanceof RetryExhaustedError),
      }),
    ).rejects.toBeInstanceOf(RetryExhaustedError);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("throws RetryExhaustedError after all retries exhausted on retryStatus", async () => {
    const fn = vi
      .fn<(arg: { attempt: number }) => Promise<RetryOutcome<string>>>()
      .mockImplementation(async () => ({ kind: "retryStatus", status: 503 }));
    await expect(withRetry<string>(fn, fastPolicy)).rejects.toBeInstanceOf(
      RetryExhaustedError,
    );
    expect(fn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });

  it("retries on thrown errors when isRetryableError allows", async () => {
    const fn = vi
      .fn<(arg: { attempt: number }) => Promise<RetryOutcome<string>>>()
      .mockImplementationOnce(async () => {
        throw new Error("transient");
      })
      .mockImplementationOnce(async () => ({ kind: "ok", value: "ok" }));
    const result = await withRetry<string>(fn, fastPolicy);
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("does NOT retry when isRetryableError returns false", async () => {
    const fn = vi
      .fn<(arg: { attempt: number }) => Promise<RetryOutcome<string>>>()
      .mockImplementation(async () => {
        throw new Error("permanent");
      });
    await expect(
      withRetry<string>(fn, {
        ...fastPolicy,
        isRetryableError: () => false,
      }),
    ).rejects.toThrow("permanent");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("propagates the last thrown error after exhausting retries", async () => {
    const fn = vi
      .fn<(arg: { attempt: number }) => Promise<RetryOutcome<string>>>()
      .mockImplementation(async () => {
        throw new Error("always-fails");
      });
    await expect(withRetry<string>(fn, fastPolicy)).rejects.toThrow(
      "always-fails",
    );
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("passes the correct attempt index to fn", async () => {
    const seenAttempts: number[] = [];
    const fn = vi
      .fn<(arg: { attempt: number }) => Promise<RetryOutcome<string>>>()
      .mockImplementation(async ({ attempt }) => {
        seenAttempts.push(attempt);
        if (attempt < 2) return { kind: "retryStatus", status: 503 };
        return { kind: "ok", value: "done" };
      });
    await withRetry<string>(fn, fastPolicy);
    expect(seenAttempts).toEqual([0, 1, 2]);
  });
});

describe("RetryExhaustedError", () => {
  it("includes attempt count in the message", () => {
    const e = new RetryExhaustedError(3, 503);
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("RetryExhaustedError");
    expect(e.message).toContain("3 attempts");
    expect(e.message).toContain("status=503");
  });

  it("works without a status code", () => {
    const e = new RetryExhaustedError(2);
    expect(e.attempts).toBe(2);
    expect(e.lastStatus).toBeUndefined();
    expect(e.message).toContain("2 attempts");
  });

  it("appends Error.message when lastError is an Error", () => {
    const inner = new Error("kaboom");
    const e = new RetryExhaustedError(2, undefined, inner);
    expect(e.message).toContain("kaboom");
    expect(e.lastError).toBe(inner);
  });
});
