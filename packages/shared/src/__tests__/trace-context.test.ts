// Coverage push — OTel ↔ Pino bridge. Without this module every log
// line loses its trace correlation; we lock the three branches:
//   - module not primed: returns undefined silently (no throw)
//   - active span exists with a real traceId: returns { traceId, spanId,
//     traceFlags }
//   - active span has the all-zeros traceId (the OTel "no-op span"
//     sentinel): treats as no context, returns undefined
//
// We avoid actually loading `@opentelemetry/api` — the module's whole
// purpose is to work without it. Instead we mutate the internal `syncApi`
// via the prime function with a stub.
import { describe, it, expect, vi, beforeEach } from "vitest";

// Re-import per-test by clearing the module cache. Otherwise primeTrace
// from one test leaks `syncApi` into the next.
async function freshModule() {
  vi.resetModules();
  return await import("../observability/trace-context");
}

describe("getActiveTraceContext", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns undefined when prime hasn't run (no OTel installed)", async () => {
    const mod = await freshModule();
    expect(mod.getActiveTraceContext()).toBeUndefined();
  });

  it("returns undefined when prime fails to import OTel (graceful degrade)", async () => {
    // primeTraceContext catches the import error and leaves syncApi=null;
    // the next call should silently return undefined.
    const mod = await freshModule();
    await mod.primeTraceContext(); // import will fail in this test runtime; that's the point
    expect(mod.getActiveTraceContext()).toBeUndefined();
  });
});

describe("getActiveTraceContext with stubbed OTel", () => {
  // Use vi.doMock to intercept the dynamic import inside primeTraceContext.
  it("returns the span context when an active span exists", async () => {
    vi.resetModules();
    const fakeOtel = {
      trace: {
        getActiveSpan: () => ({
          spanContext: () => ({
            traceId: "abcdef0123456789abcdef0123456789",
            spanId: "abcdef0123456789",
            traceFlags: 1,
          }),
        }),
      },
    };
    vi.doMock("@opentelemetry/api", () => fakeOtel);
    const mod = await import("../observability/trace-context");
    await mod.primeTraceContext();
    expect(mod.getActiveTraceContext()).toEqual({
      traceId: "abcdef0123456789abcdef0123456789",
      spanId: "abcdef0123456789",
      traceFlags: 1,
    });
    vi.doUnmock("@opentelemetry/api");
  });

  it("returns undefined when traceId is the no-op sentinel (all zeros)", async () => {
    vi.resetModules();
    vi.doMock("@opentelemetry/api", () => ({
      trace: {
        getActiveSpan: () => ({
          spanContext: () => ({
            traceId: "00000000000000000000000000000000",
            spanId: "0000000000000000",
            traceFlags: 0,
          }),
        }),
      },
    }));
    const mod = await import("../observability/trace-context");
    await mod.primeTraceContext();
    expect(mod.getActiveTraceContext()).toBeUndefined();
    vi.doUnmock("@opentelemetry/api");
  });

  it("returns undefined when getActiveSpan returns null (no current span)", async () => {
    vi.resetModules();
    vi.doMock("@opentelemetry/api", () => ({
      trace: { getActiveSpan: () => null },
    }));
    const mod = await import("../observability/trace-context");
    await mod.primeTraceContext();
    expect(mod.getActiveTraceContext()).toBeUndefined();
    vi.doUnmock("@opentelemetry/api");
  });
});
