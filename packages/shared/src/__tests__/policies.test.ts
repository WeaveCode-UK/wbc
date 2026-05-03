import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// ACH-008/ACH-012. Default per-provider policies, configurable via env.
// Module reads env at import time, so we reset module cache + env in
// each scenario via `vi.resetModules()`.

const ENV_KEYS = [
  "WHATSAPP_MAX_RETRIES",
  "WHATSAPP_RETRY_DELAY_MS",
  "WHATSAPP_TIMEOUT_MS",
  "WHATSAPP_CIRCUIT_THRESHOLD",
  "WHATSAPP_CIRCUIT_WINDOW_MS",
  "DEEPSEEK_MAX_RETRIES",
  "DEEPSEEK_RETRY_DELAY_MS",
  "DEEPSEEK_TIMEOUT_MS",
  "DEEPSEEK_CIRCUIT_THRESHOLD",
  "DEEPSEEK_CIRCUIT_WINDOW_MS",
] as const;

interface PoliciesModule {
  whatsappRetryPolicy: { maxRetries: number; baseDelayMs: number };
  whatsappTimeoutPolicy: { timeoutMs: number };
  whatsappCircuitPolicy: { failureThreshold: number; resetTimeoutMs: number };
  deepseekRetryPolicy: { maxRetries: number; baseDelayMs: number };
  deepseekTimeoutPolicy: { timeoutMs: number };
  deepseekCircuitPolicy: { failureThreshold: number; resetTimeoutMs: number };
}

async function loadPoliciesFresh(): Promise<PoliciesModule> {
  vi.resetModules();
  return (await import("../resilience/policies")) as unknown as PoliciesModule;
}

describe("default policies (no env overrides)", () => {
  let savedEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    savedEnv = {};
    for (const key of ENV_KEYS) {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      const v = savedEnv[key];
      if (v === undefined) delete process.env[key];
      else process.env[key] = v;
    }
  });

  it("WhatsApp policies use the documented defaults", async () => {
    const mod = await loadPoliciesFresh();
    expect(mod.whatsappRetryPolicy.maxRetries).toBe(2);
    expect(mod.whatsappRetryPolicy.baseDelayMs).toBe(1_000);
    expect(mod.whatsappTimeoutPolicy.timeoutMs).toBe(10_000);
    expect(mod.whatsappCircuitPolicy.failureThreshold).toBe(5);
    expect(mod.whatsappCircuitPolicy.resetTimeoutMs).toBe(60_000);
  });

  it("DeepSeek policies use the documented defaults (more conservative breaker)", async () => {
    const mod = await loadPoliciesFresh();
    expect(mod.deepseekRetryPolicy.maxRetries).toBe(2);
    expect(mod.deepseekRetryPolicy.baseDelayMs).toBe(2_000);
    expect(mod.deepseekTimeoutPolicy.timeoutMs).toBe(30_000);
    // Default 3 — more aggressive than WhatsApp because LLM calls cascade.
    expect(mod.deepseekCircuitPolicy.failureThreshold).toBe(3);
    expect(mod.deepseekCircuitPolicy.resetTimeoutMs).toBe(60_000);
  });
});

describe("env override behaviour", () => {
  let savedEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    savedEnv = {};
    for (const key of ENV_KEYS) {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      const v = savedEnv[key];
      if (v === undefined) delete process.env[key];
      else process.env[key] = v;
    }
  });

  it("respects positive integer env overrides", async () => {
    process.env.WHATSAPP_MAX_RETRIES = "7";
    process.env.WHATSAPP_TIMEOUT_MS = "12345";
    const mod = await loadPoliciesFresh();
    expect(mod.whatsappRetryPolicy.maxRetries).toBe(7);
    expect(mod.whatsappTimeoutPolicy.timeoutMs).toBe(12345);
  });

  it("ignores non-numeric env values and keeps the default", async () => {
    process.env.WHATSAPP_MAX_RETRIES = "not-a-number";
    const mod = await loadPoliciesFresh();
    expect(mod.whatsappRetryPolicy.maxRetries).toBe(2);
  });

  it("ignores zero and negative env values (must be positive)", async () => {
    process.env.WHATSAPP_TIMEOUT_MS = "0";
    process.env.DEEPSEEK_TIMEOUT_MS = "-100";
    const mod = await loadPoliciesFresh();
    expect(mod.whatsappTimeoutPolicy.timeoutMs).toBe(10_000);
    expect(mod.deepseekTimeoutPolicy.timeoutMs).toBe(30_000);
  });

  it("respects DeepSeek and circuit-breaker env overrides", async () => {
    process.env.DEEPSEEK_MAX_RETRIES = "5";
    process.env.DEEPSEEK_CIRCUIT_THRESHOLD = "2";
    process.env.WHATSAPP_CIRCUIT_WINDOW_MS = "120000";
    const mod = await loadPoliciesFresh();
    expect(mod.deepseekRetryPolicy.maxRetries).toBe(5);
    expect(mod.deepseekCircuitPolicy.failureThreshold).toBe(2);
    expect(mod.whatsappCircuitPolicy.resetTimeoutMs).toBe(120_000);
  });
});
