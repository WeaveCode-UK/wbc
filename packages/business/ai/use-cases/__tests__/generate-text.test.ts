import { describe, it, expect, vi } from "vitest";
import {
  generateCampaignText,
  generateBillingMessage,
  generateReactivation,
  correctText,
} from "../generate-text";
import type { AIProvider } from "../../ports/ai-provider";
import type { AIRepository } from "../../ports/ai-repository";

function makeFakeProvider(text = "ok"): AIProvider & {
  calls: Array<{ system: string; user: string }>;
} {
  const calls: Array<{ system: string; user: string }> = [];
  return {
    calls,
    async generateChat({ system, user }) {
      calls.push({ system, user });
      return { text, inputTokens: 10, outputTokens: 5, model: "fake" };
    },
  };
}

function makeFakeRepo(): AIRepository & {
  recordings: Array<{ tenantId: string; mode: string; prompt: string }>;
  limitChecked: number;
} {
  const recordings: Array<{
    tenantId: string;
    mode: string;
    prompt: string;
  }> = [];
  return {
    recordings,
    limitChecked: 0,
    async checkLimit() {
      this.limitChecked += 1;
    },
    async recordGeneration(tenantId, mode, _in, _out, _model, prompt) {
      recordings.push({ tenantId, mode, prompt });
    },
    async getUsage() {
      return { used: 0, limit: 30 };
    },
  };
}

describe("generate-text — AI use-cases", () => {
  it("wraps user input in <input>…</input> markers (prompt-injection guard)", async () => {
    const provider = makeFakeProvider();
    const repo = makeFakeRepo();
    await generateCampaignText(
      "tenant-1",
      "Black Friday: 30% off em batom",
      provider,
      repo,
    );
    expect(provider.calls[0]?.user).toMatch(/^<input>.*<\/input>$/);
    expect(provider.calls[0]?.user).toContain("Black Friday");
  });

  it("clamps user input to 4000 chars to bound the prompt budget", async () => {
    const provider = makeFakeProvider();
    const repo = makeFakeRepo();
    const huge = "x".repeat(10_000);
    await generateCampaignText("tenant-1", huge, provider, repo);
    // 4000 chars + "<input>" (7) + "</input>" (8) = 4015
    expect(provider.calls[0]?.user.length).toBeLessThanOrEqual(4015);
  });

  it("calls checkLimit before invoking the provider", async () => {
    const provider = makeFakeProvider();
    const repo = makeFakeRepo();
    await generateCampaignText("tenant-1", "x", provider, repo);
    expect(repo.limitChecked).toBe(1);
    expect(repo.recordings).toHaveLength(1);
    expect(repo.recordings[0]?.mode).toBe("CAMPAIGN");
  });

  it("billing message embeds amount with two decimals", async () => {
    const provider = makeFakeProvider();
    const repo = makeFakeRepo();
    await generateBillingMessage(
      "tenant-1",
      "Ana",
      150.5,
      "2026-06-01",
      provider,
      repo,
    );
    expect(provider.calls[0]?.user).toContain("valor=150.50");
    expect(repo.recordings[0]?.mode).toBe("BILLING");
  });

  it("reactivation includes lastPurchaseDate as data", async () => {
    const provider = makeFakeProvider();
    const repo = makeFakeRepo();
    await generateReactivation("tenant-1", "Bia", "2026-01-10", provider, repo);
    expect(provider.calls[0]?.user).toContain("ultima_compra=2026-01-10");
    expect(repo.recordings[0]?.mode).toBe("REACTIVATION");
  });

  it("correctText returns the model output as correctedText", async () => {
    const provider = makeFakeProvider("texto corrigido");
    const repo = makeFakeRepo();
    const result = await correctText(
      "tenant-1",
      "texto cum erros",
      provider,
      repo,
    );
    expect(result.correctedText).toBe("texto corrigido");
    expect(repo.recordings[0]?.mode).toBe("CORRECTION");
  });

  it("propagates checkLimit failures (rate limited)", async () => {
    const provider = makeFakeProvider();
    const repo = makeFakeRepo();
    repo.checkLimit = vi.fn().mockRejectedValue(new Error("AI_LIMIT_REACHED"));
    await expect(
      generateCampaignText("t", "x", provider, repo),
    ).rejects.toThrow("AI_LIMIT_REACHED");
  });
});
