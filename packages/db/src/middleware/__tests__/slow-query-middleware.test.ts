// Coverage gap: slow-query-middleware is a tiny but load-bearing
// observability hook. The contract:
//   - measures duration around `next(params)` even when next throws
//   - logs ONLY when duration ≥ threshold AND Math.random() < sampleRate
//   - does NOT log args (PII) — only model/action/duration/argsKeys
//   - threshold defaults to 500ms; sampleRate defaults to 1.0
//
// We mock `performance.now()` to avoid sleeping in tests.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Prisma } from "@prisma/client";
import { createSlowQueryMiddleware } from "../slow-query-middleware";

const ORIGINAL_NOW = performance.now.bind(performance);
const ORIGINAL_RANDOM = Math.random;

let nowSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  nowSpy = vi.spyOn(performance, "now");
});

afterEach(() => {
  performance.now = ORIGINAL_NOW;
  Math.random = ORIGINAL_RANDOM;
});

function buildParams(
  partial: Partial<Prisma.MiddlewareParams>,
): Prisma.MiddlewareParams {
  return {
    model: "Client",
    action: "findMany",
    args: { where: { id: "x" } },
    dataPath: [],
    runInTransaction: false,
    ...partial,
  } as Prisma.MiddlewareParams;
}

describe("createSlowQueryMiddleware", () => {
  it("does NOT log when duration is under the threshold", async () => {
    const warn = vi.fn();
    const mw = createSlowQueryMiddleware({ warn, thresholdMs: 500 });
    nowSpy.mockReturnValueOnce(0).mockReturnValueOnce(100); // 100ms

    await mw(buildParams({}), async () => "result");

    expect(warn).not.toHaveBeenCalled();
  });

  it("logs when duration ≥ threshold (default 500ms)", async () => {
    const warn = vi.fn();
    const mw = createSlowQueryMiddleware({ warn });
    nowSpy.mockReturnValueOnce(0).mockReturnValueOnce(750); // 750ms

    await mw(buildParams({}), async () => "result");

    expect(warn).toHaveBeenCalledOnce();
    const fields = warn.mock.calls[0]![0] as {
      model: string;
      action: string;
      durationMs: number;
      argsKeys: string[];
    };
    expect(fields.model).toBe("Client");
    expect(fields.action).toBe("findMany");
    expect(fields.durationMs).toBe(750);
  });

  it("logs argsKeys but NOT args (PII guard)", async () => {
    const warn = vi.fn();
    const mw = createSlowQueryMiddleware({ warn });
    nowSpy.mockReturnValueOnce(0).mockReturnValueOnce(1000);

    await mw(
      buildParams({ args: { where: { phone: "+5511999990000" } } }),
      async () => "ok",
    );

    const fields = warn.mock.calls[0]![0] as {
      args?: unknown;
      argsKeys: string[];
    };
    // The phone number must NOT make it to the structured log.
    expect(fields.args).toBeUndefined();
    expect(fields.argsKeys).toEqual(["where"]);
    expect(JSON.stringify(fields)).not.toContain("+5511999990000");
  });

  it("returns the value next() resolves to", async () => {
    const warn = vi.fn();
    const mw = createSlowQueryMiddleware({ warn });
    nowSpy.mockReturnValueOnce(0).mockReturnValueOnce(10);

    const result = await mw(buildParams({}), async () => ({ rows: 5 }));

    expect(result).toEqual({ rows: 5 });
  });

  it("still measures + logs when next() throws (error path duration matters)", async () => {
    const warn = vi.fn();
    const mw = createSlowQueryMiddleware({ warn });
    nowSpy.mockReturnValueOnce(0).mockReturnValueOnce(800);

    await expect(
      mw(buildParams({}), async () => {
        throw new Error("query failed");
      }),
    ).rejects.toThrow("query failed");

    // The slow-query log still fires — that's the "even when next
    // throws" property in the docstring; otherwise crashing queries
    // never get observability.
    expect(warn).toHaveBeenCalledOnce();
  });

  it("respects sampleRate (rate=0 → never logs)", async () => {
    const warn = vi.fn();
    const mw = createSlowQueryMiddleware({
      warn,
      thresholdMs: 100,
      sampleRate: 0,
    });
    nowSpy.mockReturnValueOnce(0).mockReturnValueOnce(1000);
    // Math.random doesn't matter when sampleRate is 0 — `< 0` is never true.

    await mw(buildParams({}), async () => null);

    expect(warn).not.toHaveBeenCalled();
  });

  it("sampleRate=1 always logs slow queries", async () => {
    const warn = vi.fn();
    const mw = createSlowQueryMiddleware({
      warn,
      thresholdMs: 100,
      sampleRate: 1,
    });
    nowSpy.mockReturnValueOnce(0).mockReturnValueOnce(200);
    // Even with random=0.99 (almost-but-not-quite-1), `< 1.0` is true.
    Math.random = () => 0.99;

    await mw(buildParams({}), async () => null);

    expect(warn).toHaveBeenCalledOnce();
  });
});
