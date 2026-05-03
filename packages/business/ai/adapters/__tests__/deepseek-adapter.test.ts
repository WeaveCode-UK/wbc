// T3.5 — DeepSeekAdapter
//
// Three load-bearing properties:
//   - The adapter calls DeepSeek with `{role: "system"} + {role: "user"}`
//     so the provider's role-separation prompt-injection defence (ACH-020)
//     actually applies. If a refactor merged them back into one user
//     message, untrusted text would re-gain instructional power.
//   - Timeout is configurable via the `policies.timeout` constructor
//     argument. We don't need to drive fake timers — we just check the
//     adapter respects the value we hand in (via abort-on-fast-timeout).
//   - The circuit breaker (T2.15 covers it directly) is in-line with
//     `generateChat`. We confirm by exhausting the breaker and observing
//     the documented Portuguese fallback string.

import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type Mock,
} from "vitest";
import { DeepSeekAdapter } from "../deepseek-adapter";

const ORIGINAL_FETCH = globalThis.fetch;
const ORIGINAL_ENV = { ...process.env };

interface FetchInit {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
}

function ok(text: string, prompt = 10, completion = 20): unknown {
  return {
    choices: [{ message: { content: text } }],
    usage: { prompt_tokens: prompt, completion_tokens: completion },
  };
}

function mockFetch(
  responses: Array<{ ok: boolean; status: number; body?: unknown }>,
): Mock {
  let i = 0;
  const fn = vi.fn().mockImplementation(async () => {
    const r = responses[Math.min(i, responses.length - 1)]!;
    i++;
    return {
      ok: r.ok,
      status: r.status,
      json: async () => r.body ?? {},
    } as unknown as Response;
  });
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
}

beforeEach(() => {
  process.env.DEEPSEEK_API_KEY = "ds-test-key";
  // Make every breaker independent + tolerant for sequence tests.
  process.env.DEEPSEEK_CIRCUIT_THRESHOLD = "999";
  process.env.DEEPSEEK_CIRCUIT_WINDOW_MS = "60000";
});

afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH;
  process.env = { ...ORIGINAL_ENV };
});

describe("DeepSeekAdapter — payload + role separation", () => {
  it("returns a [DEV] stub when DEEPSEEK_API_KEY is empty (does NOT call fetch)", async () => {
    delete process.env.DEEPSEEK_API_KEY;
    const fn = mockFetch([{ ok: true, status: 200, body: ok("real") }]);
    const adapter = new DeepSeekAdapter();

    const r = await adapter.generateChat({
      system: "be brief",
      user: "hello",
    });

    expect(fn).not.toHaveBeenCalled();
    expect(r.text).toMatch(/^\[DEV\]/);
  });

  it("sends system + user as separate role messages (ACH-020)", async () => {
    const fn = mockFetch([{ ok: true, status: 200, body: ok("ok") }]);
    const adapter = new DeepSeekAdapter({
      retry: { maxRetries: 0, baseDelayMs: 1 },
    });

    await adapter.generateChat({
      system: "Você é um redator. Saída em PT-BR.",
      user: "tema: pomada",
    });

    const init = fn.mock.calls[0]![1] as FetchInit;
    const body = JSON.parse(init.body ?? "{}");
    expect(body.messages).toEqual([
      { role: "system", content: "Você é um redator. Saída em PT-BR." },
      { role: "user", content: "tema: pomada" },
    ]);
  });

  it("omits the system message when the input.system is empty", async () => {
    const fn = mockFetch([{ ok: true, status: 200, body: ok("ok") }]);
    const adapter = new DeepSeekAdapter({
      retry: { maxRetries: 0, baseDelayMs: 1 },
    });

    await adapter.generateChat({ system: "", user: "hi" });

    const body = JSON.parse((fn.mock.calls[0]![1] as FetchInit).body ?? "{}");
    expect(body.messages).toEqual([{ role: "user", content: "hi" }]);
  });

  it("attaches Bearer token + content-type", async () => {
    const fn = mockFetch([{ ok: true, status: 200, body: ok("ok") }]);
    const adapter = new DeepSeekAdapter({
      retry: { maxRetries: 0, baseDelayMs: 1 },
    });

    await adapter.generateChat({ system: "", user: "hi" });

    const headers = (fn.mock.calls[0]![1] as FetchInit).headers!;
    expect(headers.Authorization).toBe("Bearer ds-test-key");
    expect(headers["Content-Type"]).toBe("application/json");
  });

  it("calls the v1/chat/completions endpoint", async () => {
    const fn = mockFetch([{ ok: true, status: 200, body: ok("ok") }]);
    const adapter = new DeepSeekAdapter({
      retry: { maxRetries: 0, baseDelayMs: 1 },
    });

    await adapter.generateChat({ system: "", user: "hi" });

    expect(fn.mock.calls[0]![0]).toBe(
      "https://api.deepseek.com/v1/chat/completions",
    );
  });

  it("returns text + usage tokens from a happy response", async () => {
    mockFetch([{ ok: true, status: 200, body: ok("answer", 7, 13) }]);
    const adapter = new DeepSeekAdapter({
      retry: { maxRetries: 0, baseDelayMs: 1 },
    });

    const r = await adapter.generateChat({ system: "", user: "q" });

    expect(r).toEqual({
      text: "answer",
      inputTokens: 7,
      outputTokens: 13,
      model: "deepseek-chat",
    });
  });

  it("`generate(prompt)` legacy entry forwards through `generateChat({system:'', user})`", async () => {
    const fn = mockFetch([{ ok: true, status: 200, body: ok("legacy") }]);
    const adapter = new DeepSeekAdapter({
      retry: { maxRetries: 0, baseDelayMs: 1 },
    });

    await adapter.generate("legacy prompt");

    const body = JSON.parse((fn.mock.calls[0]![1] as FetchInit).body ?? "{}");
    expect(body.messages).toEqual([{ role: "user", content: "legacy prompt" }]);
  });
});

describe("DeepSeekAdapter — retry / failure semantics", () => {
  it("retries on 429 then succeeds", async () => {
    const fn = mockFetch([
      { ok: false, status: 429 },
      { ok: true, status: 200, body: ok("after-retry") },
    ]);
    const adapter = new DeepSeekAdapter({
      retry: { maxRetries: 2, baseDelayMs: 1 },
    });

    const r = await adapter.generateChat({ system: "", user: "q" });

    expect(r.text).toBe("after-retry");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("falls back via the breaker on persistent 400 (returns PT fallback string)", async () => {
    // NB: the adapter's `callApi` re-throws on non-retryable status, but
    // the outer try/catch retries on ANY thrown error (including the
    // 400). With maxRetries=0 we get a single attempt + immediate
    // breaker fallback — this is the property we want to lock.
    const fn = mockFetch([{ ok: false, status: 400 }]);
    const adapter = new DeepSeekAdapter({
      retry: { maxRetries: 0, baseDelayMs: 1 },
    });

    const r = await adapter.generateChat({ system: "", user: "q" });
    expect(r.text).toBe(
      "[AI indisponível no momento. Tente novamente em breve.]",
    );
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe("DeepSeekAdapter — timeout configurability", () => {
  it("aborts the in-flight fetch when timeoutMs elapses", async () => {
    // Capture the signal and confirm it triggers when we never resolve.
    // Breaker swallows the error into fallback — what we want to lock
    // is that the AbortSignal threaded through reached the abort state.
    let captured: AbortSignal | undefined;
    globalThis.fetch = vi.fn().mockImplementation((_url, init) => {
      const i = init as FetchInit;
      captured = i.signal;
      return new Promise<Response>((_res, rej) => {
        i.signal?.addEventListener("abort", () =>
          rej(new Error("aborted by signal")),
        );
      });
    }) as unknown as typeof fetch;

    const adapter = new DeepSeekAdapter({
      retry: { maxRetries: 0, baseDelayMs: 1 },
      timeout: { timeoutMs: 5 },
    });

    const r = await adapter.generateChat({ system: "", user: "x" });
    // Fallback fires once the underlying fetch rejects via abort.
    expect(r.text).toBe(
      "[AI indisponível no momento. Tente novamente em breve.]",
    );
    expect(captured).toBeDefined();
    expect(captured!.aborted).toBe(true);
  });

  it("respects a custom timeoutPolicy passed via constructor (call completes under generous timeout)", async () => {
    const fn = mockFetch([{ ok: true, status: 200, body: ok("ok") }]);

    const adapter = new DeepSeekAdapter({
      retry: { maxRetries: 0, baseDelayMs: 1 },
      timeout: { timeoutMs: 1000 },
    });

    const r = await adapter.generateChat({ system: "", user: "x" });
    expect(r.text).toBe("ok");
    expect(fn).toHaveBeenCalledOnce();
  });
});

describe("DeepSeekAdapter — circuit breaker integration (T2.15 cross-ref)", () => {
  it("short-circuits to the PT fallback once the breaker opens (no further fetch calls)", async () => {
    // The breaker is module-level inside the adapter; reset modules so
    // this test gets its own instance with a low threshold.
    process.env.DEEPSEEK_CIRCUIT_THRESHOLD = "1";
    vi.resetModules();
    const { DeepSeekAdapter: FreshAdapter } =
      await import("../deepseek-adapter");

    let calls = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      calls++;
      throw new Error("network down");
    }) as unknown as typeof fetch;

    const adapter = new FreshAdapter({
      retry: { maxRetries: 0, baseDelayMs: 1 },
    });

    // First call: real failure → fallback (breaker counts the failure).
    const first = await adapter.generateChat({ system: "", user: "x" });
    expect(first.text).toBe(
      "[AI indisponível no momento. Tente novamente em breve.]",
    );
    expect(calls).toBe(1);

    // Second call: breaker should be OPEN — fallback fires WITHOUT
    // invoking fetch again. That's the contract T2.15 anchors.
    const second = await adapter.generateChat({ system: "", user: "x" });
    expect(second.text).toBe(
      "[AI indisponível no momento. Tente novamente em breve.]",
    );
    expect(calls).toBe(1);
  });
});
