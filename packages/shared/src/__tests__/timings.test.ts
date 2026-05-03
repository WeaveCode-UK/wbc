import { describe, it, expect } from "vitest";
import {
  OUTBOX_POLL_INTERVAL_MS,
  OUTBOX_CLEANUP_INTERVAL_MS,
  DLQ_SCAN_INTERVAL_MS,
  WORKER_SHUTDOWN_TIMEOUT_MS,
  CACHE_TTL_DEFAULT_SECONDS,
  CACHE_TTL_SHORT_SECONDS,
  CACHE_TTL_LONG_SECONDS,
  RATE_LIMIT_PUBLIC_WINDOW_MS,
  RATE_LIMIT_PROTECTED_WINDOW_MS,
  OUTBOX_READY_LAG_THRESHOLD_MS,
  PASSWORD_RESET_TTL_SECONDS,
  EMAIL_VERIFICATION_TTL_SECONDS,
  SESSION_MAX_AGE_SECONDS,
  LOGIN_LOCKOUT_WINDOW_SECONDS,
  LOGIN_LOCKOUT_MAX_FAILURES,
} from "../constants/timings";

// Centralised timing constants (ACH-010). These pin runtime policy and
// any change must be deliberate — that's why a flat snapshot test is a
// useful brake. Values are documented in the source.

describe("worker polling intervals", () => {
  it("OUTBOX_POLL_INTERVAL_MS is 5 seconds", () => {
    expect(OUTBOX_POLL_INTERVAL_MS).toBe(5_000);
  });

  it("OUTBOX_CLEANUP_INTERVAL_MS is 24 hours", () => {
    expect(OUTBOX_CLEANUP_INTERVAL_MS).toBe(24 * 60 * 60 * 1_000);
  });

  it("DLQ_SCAN_INTERVAL_MS is 60 seconds", () => {
    expect(DLQ_SCAN_INTERVAL_MS).toBe(60_000);
  });
});

describe("graceful shutdown", () => {
  it("WORKER_SHUTDOWN_TIMEOUT_MS is 30 seconds", () => {
    expect(WORKER_SHUTDOWN_TIMEOUT_MS).toBe(30_000);
  });
});

describe("cache TTLs (seconds, to match Redis EX)", () => {
  it("default is 5 minutes", () => {
    expect(CACHE_TTL_DEFAULT_SECONDS).toBe(300);
  });

  it("short is 1 minute", () => {
    expect(CACHE_TTL_SHORT_SECONDS).toBe(60);
  });

  it("long is 1 hour", () => {
    expect(CACHE_TTL_LONG_SECONDS).toBe(3600);
  });
});

describe("rate-limit windows", () => {
  it("public window is 60 seconds", () => {
    expect(RATE_LIMIT_PUBLIC_WINDOW_MS).toBe(60_000);
  });

  it("protected window is 60 seconds", () => {
    expect(RATE_LIMIT_PROTECTED_WINDOW_MS).toBe(60_000);
  });
});

describe("health / readiness", () => {
  it("OUTBOX_READY_LAG_THRESHOLD_MS is 60 seconds", () => {
    expect(OUTBOX_READY_LAG_THRESHOLD_MS).toBe(60_000);
  });
});

describe("auth / token TTLs", () => {
  it("password reset token lasts 1 hour", () => {
    expect(PASSWORD_RESET_TTL_SECONDS).toBe(60 * 60);
  });

  it("email verification token lasts 24 hours", () => {
    expect(EMAIL_VERIFICATION_TTL_SECONDS).toBe(24 * 60 * 60);
  });

  it("session lasts 15 minutes", () => {
    expect(SESSION_MAX_AGE_SECONDS).toBe(15 * 60);
  });

  it("login lockout window is 15 minutes", () => {
    expect(LOGIN_LOCKOUT_WINDOW_SECONDS).toBe(15 * 60);
  });

  it("login lockout trips after 5 failures", () => {
    expect(LOGIN_LOCKOUT_MAX_FAILURES).toBe(5);
  });
});
