// Coverage push — Sentry cost-noise filter. Wrong heuristics here cause
// either: (a) we drop a real bug → silent failure, or (b) we send 404
// exploration → Sentry quota burn. We assert each rule path:
//   - HTTP 401/404 → noise (exploration, not bugs)
//   - exception.values[].type in NOISE_ERROR_NAMES → noise
//   - exception.values[].value matches a noise regex → noise
//   - top-level message matches a noise regex → noise
//   - none of the above → keep
//   - non-object input is ignored (no throw)
import { describe, it, expect } from "vitest";
import { isCostNoiseEvent, filterCostNoise } from "../sentry-noise-filter";

describe("isCostNoiseEvent", () => {
  it("returns false for null/non-object", () => {
    expect(isCostNoiseEvent(null)).toBe(false);
    expect(isCostNoiseEvent(undefined)).toBe(false);
    expect(isCostNoiseEvent("string")).toBe(false);
    expect(isCostNoiseEvent(42)).toBe(false);
  });

  it("HTTP 401 or 404 are dropped (exploration noise)", () => {
    expect(
      isCostNoiseEvent({ contexts: { response: { status_code: 404 } } }),
    ).toBe(true);
    expect(
      isCostNoiseEvent({ contexts: { response: { status_code: 401 } } }),
    ).toBe(true);
  });

  it("HTTP 500 is kept (real error)", () => {
    expect(
      isCostNoiseEvent({ contexts: { response: { status_code: 500 } } }),
    ).toBe(false);
  });

  it("AbortError / ChunkLoadError / ResizeObserverLoopError → noise", () => {
    for (const type of [
      "AbortError",
      "ChunkLoadError",
      "ResizeObserverLoopError",
    ]) {
      expect(
        isCostNoiseEvent({
          exception: { values: [{ type, value: "boom" }] },
        }),
      ).toBe(true);
    }
  });

  it("custom error type is kept", () => {
    expect(
      isCostNoiseEvent({
        exception: { values: [{ type: "DomainError", value: "oh no" }] },
      }),
    ).toBe(false);
  });

  it("ETIMEDOUT / ECONNRESET / Failed to fetch / aborted → noise", () => {
    for (const value of [
      "ETIMEDOUT after 30s",
      "ECONNRESET while reading",
      "TypeError: Failed to fetch",
      "NetworkError when attempting to fetch resource.",
      "The operation was aborted",
      "ResizeObserver loop limit exceeded",
    ]) {
      expect(
        isCostNoiseEvent({
          exception: { values: [{ type: "TypeError", value }] },
        }),
      ).toBe(true);
    }
  });

  it("matches noise patterns on the top-level message field too", () => {
    expect(isCostNoiseEvent({ message: "Failed to fetch /api/clients" })).toBe(
      true,
    );
    expect(isCostNoiseEvent({ message: "Real bug — null pointer" })).toBe(
      false,
    );
  });

  it("does not throw on missing exception.values", () => {
    expect(isCostNoiseEvent({ exception: {} })).toBe(false);
    expect(isCostNoiseEvent({})).toBe(false);
  });
});

describe("filterCostNoise", () => {
  it("returns null for noise events", () => {
    expect(
      filterCostNoise({ contexts: { response: { status_code: 404 } } }),
    ).toBeNull();
  });

  it("returns the event unchanged for real bugs", () => {
    const ev = { exception: { values: [{ type: "DomainError" }] } };
    expect(filterCostNoise(ev)).toBe(ev);
  });
});
