// T2.27 + T2.28 — AI use-cases (limits + usage tracking)
//
// `generate-text.test.ts` already covers prompt-injection wrapping
// and basic provider plumbing. This file complements with what the
// CHECAGEM list T2-E asks for explicitly:
//   - tracking increments (recordGeneration is called once per
//     successful invocation, with tokens + model preserved).
//   - over-30/month limit cuts the call BEFORE provider/recording —
//     the use-case must propagate the AI_LIMIT_REACHED clearly and
//     leave no side effects.
//   - getAIUsage forwards tenantId; per-tenant isolation (two tenants
//     get distinct counters, no leak).
// We do not test the cron reset (`counter zera no 1º do mês`) at the
// use-case layer — that's adapter-resident; flagged as follow-up.
//
// Circuit-breaker: the breaker lives in the DeepSeek adapter, behind
// the AIProvider port. From the use-case's perspective we just need
// to ensure that a provider rejection (which the breaker will manifest
// as) propagates. We model that as `provider.generateChat` rejecting.

import { describe, it, expect, vi } from "vitest";
import {
  generateCampaignText,
  generateBillingMessage,
  generateReactivation,
  correctText,
  getAIUsage,
} from "../generate-text";
import type { AIProvider } from "../../ports/ai-provider";
import type { AIRepository, AIUsage } from "../../ports/ai-repository";

function makeProvider(text = "ok"): AIProvider {
  return {
    async generate(prompt) {
      return { text, inputTokens: 12, outputTokens: 7, model: "deepseek-mock" };
    },
    async generateChat({ system: _s, user: _u }) {
      return { text, inputTokens: 12, outputTokens: 7, model: "deepseek-mock" };
    },
  };
}

function makeRepo(overrides: Partial<AIRepository> = {}): AIRepository {
  return {
    checkLimit: vi.fn().mockResolvedValue(undefined),
    recordGeneration: vi.fn().mockResolvedValue(undefined),
    getUsage: vi.fn().mockResolvedValue({
      used: 0,
      limit: 30,
      remaining: 30,
    } satisfies AIUsage),
    ...overrides,
  };
}

describe("AI tracking — recordGeneration is called with token + model context", () => {
  it("records CAMPAIGN with input/output tokens and model id", async () => {
    const repo = makeRepo();
    await generateCampaignText("t1", "promoção", makeProvider(), repo);
    expect(repo.recordGeneration).toHaveBeenCalledTimes(1);
    expect(repo.recordGeneration).toHaveBeenCalledWith(
      "t1",
      "CAMPAIGN",
      12,
      7,
      "deepseek-mock",
      expect.any(String),
      "ok",
    );
  });

  it("records BILLING with the formatted amount inside the prompt blob", async () => {
    const repo = makeRepo();
    await generateBillingMessage(
      "t1",
      "Ana",
      99.9,
      "2026-06-15",
      makeProvider(),
      repo,
    );
    const call = (repo.recordGeneration as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(call?.[1]).toBe("BILLING");
    expect(call?.[5]).toContain("valor=99.90");
  });

  it("records REACTIVATION mode", async () => {
    const repo = makeRepo();
    await generateReactivation("t1", "Bia", "2026-01-01", makeProvider(), repo);
    expect(
      (repo.recordGeneration as ReturnType<typeof vi.fn>).mock.calls[0]?.[1],
    ).toBe("REACTIVATION");
  });

  it("records CORRECTION mode and returns correctedText, not text", async () => {
    const repo = makeRepo();
    const r = await correctText("t1", "txt", makeProvider("fixed"), repo);
    expect(
      (repo.recordGeneration as ReturnType<typeof vi.fn>).mock.calls[0]?.[1],
    ).toBe("CORRECTION");
    expect(r.correctedText).toBe("fixed");
  });
});

describe("AI 30/month limit (T2.27 — clear error)", () => {
  it("propagates AI_LIMIT_REACHED from checkLimit BEFORE calling the provider", async () => {
    const provider = makeProvider();
    const generateChatSpy = vi.spyOn(provider, "generateChat");
    const repo = makeRepo({
      checkLimit: vi.fn().mockRejectedValue(new Error("AI_LIMIT_REACHED")),
    });
    await expect(
      generateCampaignText("t1", "x", provider, repo),
    ).rejects.toThrow("AI_LIMIT_REACHED");
    // Why: hitting the limit must NOT leak a provider call (cost) or a
    // tracking row (false positive in usage report).
    expect(generateChatSpy).not.toHaveBeenCalled();
    expect(repo.recordGeneration).not.toHaveBeenCalled();
  });

  it("does not record on provider failure (e.g. circuit-breaker open)", async () => {
    const provider: AIProvider = {
      async generate() {
        throw new Error("circuit_breaker_open");
      },
      async generateChat() {
        throw new Error("circuit_breaker_open");
      },
    };
    const repo = makeRepo();
    await expect(
      generateCampaignText("t1", "x", provider, repo),
    ).rejects.toThrow("circuit_breaker_open");
    expect(repo.recordGeneration).not.toHaveBeenCalled();
  });

  it("checkLimit is invoked exactly once per use-case call (no double-count)", async () => {
    const repo = makeRepo();
    await generateBillingMessage(
      "t1",
      "Ana",
      10,
      "2026-06-01",
      makeProvider(),
      repo,
    );
    expect(repo.checkLimit).toHaveBeenCalledTimes(1);
    expect(repo.checkLimit).toHaveBeenCalledWith("t1");
  });
});

describe("getAIUsage (T2.28)", () => {
  it("forwards tenantId and returns the repo's usage shape", async () => {
    const repo = makeRepo({
      getUsage: vi
        .fn()
        .mockResolvedValue({ used: 12, limit: 30, remaining: 18 }),
    });
    const r = await getAIUsage("tenant-X", repo);
    expect(repo.getUsage).toHaveBeenCalledWith("tenant-X");
    expect(r).toEqual({ used: 12, limit: 30, remaining: 18 });
  });

  it("is per-tenant isolated — two tenants get the repo's distinct counters", async () => {
    const getUsage = vi
      .fn()
      .mockImplementation((tenantId: string) =>
        Promise.resolve(
          tenantId === "t1"
            ? { used: 5, limit: 30, remaining: 25 }
            : { used: 28, limit: 30, remaining: 2 },
        ),
      );
    const repo = makeRepo({ getUsage });

    const a = await getAIUsage("t1", repo);
    const b = await getAIUsage("t2", repo);

    expect(a.used).toBe(5);
    expect(b.used).toBe(28);
    expect(getUsage).toHaveBeenCalledTimes(2);
    // Why: distinct tenant args reach the repo — no shared global counter.
    expect(getUsage.mock.calls.map((c) => c[0])).toEqual(["t1", "t2"]);
  });

  it("returns the at-limit shape (used=limit, remaining=0) verbatim", async () => {
    // The use-case must not interpret remaining=0 as an error here —
    // that's checkLimit's job. getUsage is a read-only report.
    const repo = makeRepo({
      getUsage: vi
        .fn()
        .mockResolvedValue({ used: 30, limit: 30, remaining: 0 }),
    });
    const r = await getAIUsage("t1", repo);
    expect(r.remaining).toBe(0);
  });
});
