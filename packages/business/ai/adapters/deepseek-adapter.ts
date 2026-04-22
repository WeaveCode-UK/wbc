import type { AIProvider, AIGenerateResult } from "../ports/ai-provider";
import {
  CircuitBreaker,
  type RetryPolicy,
  type TimeoutPolicy,
  createTimeoutSignal,
  deepseekRetryPolicy,
  deepseekTimeoutPolicy,
  deepseekCircuitPolicy,
  requireEnv,
} from "@wbc/shared";

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

// ACH-012 confiabilidade-resiliencia: thresholds do circuit breaker vêm
// de `deepseekCircuitPolicy` (env `DEEPSEEK_CIRCUIT_THRESHOLD` / `DEEPSEEK_CIRCUIT_WINDOW_MS`).
const deepseekCircuit = new CircuitBreaker("deepseek", deepseekCircuitPolicy);

function isRetryableStatus(status: number): boolean {
  return status >= 500 || status === 429;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class DeepSeekAdapter implements AIProvider {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly retryPolicy: RetryPolicy;
  private readonly timeoutPolicy: TimeoutPolicy;

  constructor(policies: { retry?: RetryPolicy; timeout?: TimeoutPolicy } = {}) {
    // In production, fail fast if the credential is missing — silent fallback
    // to a stub would hide an integration outage. In dev/test the empty key
    // path returns a stub response (see generate()).
    this.apiKey =
      process.env.NODE_ENV === "production"
        ? requireEnv("DEEPSEEK_API_KEY")
        : (process.env.DEEPSEEK_API_KEY ?? "");
    this.model = "deepseek-chat";
    this.retryPolicy = policies.retry ?? deepseekRetryPolicy;
    this.timeoutPolicy = policies.timeout ?? deepseekTimeoutPolicy;
  }

  async generate(prompt: string): Promise<AIGenerateResult> {
    if (!this.apiKey) {
      return {
        text: `[DEV] Generated text for prompt: ${prompt.substring(0, 50)}...`,
        inputTokens: prompt.length,
        outputTokens: 50,
        model: this.model,
      };
    }

    return deepseekCircuit.execute(
      () => this.callApi(prompt),
      () => ({
        text: "[AI indisponível no momento. Tente novamente em breve.]",
        inputTokens: 0,
        outputTokens: 0,
        model: this.model,
      }),
    );
  }

  private async callApi(prompt: string): Promise<AIGenerateResult> {
    const { maxRetries, baseDelayMs } = this.retryPolicy;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const { signal, cancel } = createTimeoutSignal(this.timeoutPolicy);

      try {
        const response = await fetch(DEEPSEEK_API_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: this.model,
            messages: [{ role: "user", content: prompt }],
            max_tokens: 500,
            temperature: 0.7,
          }),
          signal,
        });

        cancel();

        if (!response.ok) {
          if (isRetryableStatus(response.status) && attempt < maxRetries) {
            await sleep(baseDelayMs * (attempt + 1));
            continue;
          }
          throw new Error(`DeepSeek API error: ${response.status}`);
        }

        const data = (await response.json()) as {
          choices: Array<{ message: { content: string } }>;
          usage: { prompt_tokens: number; completion_tokens: number };
        };

        return {
          text: data.choices[0]?.message.content ?? "",
          inputTokens: data.usage.prompt_tokens,
          outputTokens: data.usage.completion_tokens,
          model: this.model,
        };
      } catch (error) {
        cancel();
        if (attempt < maxRetries) {
          await sleep(baseDelayMs * (attempt + 1));
          continue;
        }
        throw error;
      }
    }

    throw new Error("DeepSeek API: max retries exceeded");
  }
}
