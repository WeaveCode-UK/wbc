// Coverage push — feature flags + emergency kill-switches.
// The cache is module-scoped so we MUST reset it between tests via
// __resetFlagsForTesting(); otherwise one test's env value persists
// across the file and you read stale flags. We also restore the env
// itself so test-order doesn't matter.
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { flag, __resetFlagsForTesting, KILL_SWITCH } from "../feature-flags";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  __resetFlagsForTesting();
  delete process.env.FEATURE_FLAGS_JSON;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("flag()", () => {
  it("returns the default when FEATURE_FLAGS_JSON is unset", () => {
    expect(flag("any", false)).toBe(false);
    expect(flag("any", "fallback")).toBe("fallback");
    expect(flag("any", 42)).toBe(42);
  });

  it("returns the configured value when present and same type", () => {
    process.env.FEATURE_FLAGS_JSON = JSON.stringify({
      new_flow: true,
      banner_text: "hello",
      max_clients: 100,
    });
    expect(flag("new_flow", false)).toBe(true);
    expect(flag("banner_text", "default")).toBe("hello");
    expect(flag("max_clients", 0)).toBe(100);
  });

  it("returns the default when type does not match (defensive)", () => {
    // Configured as string but caller asks for boolean — fall back.
    process.env.FEATURE_FLAGS_JSON = JSON.stringify({ x: "true" });
    expect(flag("x", false)).toBe(false);
  });

  it("falls back to default on malformed JSON", () => {
    process.env.FEATURE_FLAGS_JSON = "not-json";
    expect(flag("missing", true)).toBe(true);
  });

  it("falls back when JSON is not an object (array or primitive)", () => {
    process.env.FEATURE_FLAGS_JSON = JSON.stringify(["array", "not", "ok"]);
    expect(flag("any", true)).toBe(true);

    __resetFlagsForTesting();
    process.env.FEATURE_FLAGS_JSON = JSON.stringify("just-a-string");
    expect(flag("any", true)).toBe(true);
  });

  it("ignores null JSON object (typeof null === 'object' guard)", () => {
    process.env.FEATURE_FLAGS_JSON = "null";
    expect(flag("any", true)).toBe(true);
  });

  it("treats undefined values as missing (returns default)", () => {
    process.env.FEATURE_FLAGS_JSON = JSON.stringify({ x: undefined });
    // JSON.stringify drops undefined entries — so x is missing.
    expect(flag("x", "default")).toBe("default");
  });

  it("returns the default for an unknown flag even when the JSON loads", () => {
    process.env.FEATURE_FLAGS_JSON = JSON.stringify({ a: true });
    expect(flag("b", false)).toBe(false);
  });
});

describe("KILL_SWITCH constants — emergency cost controls", () => {
  it("exposes the four production kill-switches", () => {
    expect(KILL_SWITCH).toEqual({
      DEEPSEEK: "kill_switch.deepseek",
      WHATSAPP: "kill_switch.whatsapp",
      SENTRY: "kill_switch.sentry",
      AI_GENERATIONS: "kill_switch.ai_generations",
    });
  });

  it("default-on idiom: when unset, the integration stays enabled", () => {
    expect(flag(KILL_SWITCH.DEEPSEEK, true)).toBe(true);
    expect(flag(KILL_SWITCH.WHATSAPP, true)).toBe(true);
  });

  it("operator flips a switch via env JSON without redeploy", () => {
    process.env.FEATURE_FLAGS_JSON = JSON.stringify({
      [KILL_SWITCH.DEEPSEEK]: false,
    });
    expect(flag(KILL_SWITCH.DEEPSEEK, true)).toBe(false);
  });
});
