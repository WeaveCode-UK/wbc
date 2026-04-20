/**
 * Centralised timing constants used across apps and workers. Having these in
 * one file avoids the grep-and-replace tax whenever a policy changes, and
 * makes it obvious which knobs exist when tuning a new environment
 * (ACH-010 from audit run codigo-manutenibilidade/2026-04-18_21-45-58).
 *
 * All values are in milliseconds unless the suffix says otherwise.
 */

// ── Worker polling intervals ────────────────────────────────────────────────

export const OUTBOX_POLL_INTERVAL_MS = 5_000;
export const OUTBOX_CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1_000; // 24h
export const DLQ_SCAN_INTERVAL_MS = 60_000;

// ── Shutdown / graceful exit ───────────────────────────────────────────────

export const WORKER_SHUTDOWN_TIMEOUT_MS = 30_000;

// ── Cache TTLs (seconds to match Redis EX) ─────────────────────────────────

export const CACHE_TTL_DEFAULT_SECONDS = 300;
export const CACHE_TTL_SHORT_SECONDS = 60;
export const CACHE_TTL_LONG_SECONDS = 3600;

// ── Rate-limit windows ─────────────────────────────────────────────────────

export const RATE_LIMIT_PUBLIC_WINDOW_MS = 60_000;
export const RATE_LIMIT_PROTECTED_WINDOW_MS = 60_000;

// ── Health / readiness ──────────────────────────────────────────────────────

export const OUTBOX_READY_LAG_THRESHOLD_MS = 60_000;

// ── Auth / tokens ──────────────────────────────────────────────────────────

export const PASSWORD_RESET_TTL_SECONDS = 60 * 60; // 1h
export const EMAIL_VERIFICATION_TTL_SECONDS = 24 * 60 * 60; // 24h
export const SESSION_MAX_AGE_SECONDS = 15 * 60; // 15min
export const LOGIN_LOCKOUT_WINDOW_SECONDS = 15 * 60; // 15min
export const LOGIN_LOCKOUT_MAX_FAILURES = 5;
