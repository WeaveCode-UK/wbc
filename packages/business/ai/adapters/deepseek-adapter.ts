import type { AIProvider, AIGenerateResult } from '../ports/ai-provider';
import { CircuitBreaker } from '@wbc/shared';

const deepseekCircuit = new CircuitBreaker('deepseek', { failureThreshold: 3, resetTimeoutMs: 60_000 });

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2_000;

function isRetryable(status: number): boolean {
  return status >= 500 || status === 429;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class DeepSeekAdapter implements AIProvider {
  private readonly apiKey: string;
  private readonly model: string;

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY ?? '';
    this.model = 'deepseek-chat';
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
      () => ({ text: '[AI indisponível no momento. Tente novamente em breve.]', inputTokens: 0, outputTokens: 0, model: this.model }),
    );
  }

  private async callApi(prompt: string): Promise<AIGenerateResult> {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const response = await fetch(DEEPSEEK_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 500,
            temperature: 0.7,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          if (isRetryable(response.status) && attempt < MAX_RETRIES) {
            await sleep(RETRY_DELAY_MS * (attempt + 1));
            continue;
          }
          throw new Error(`DeepSeek API error: ${response.status}`);
        }

        const data = await response.json() as {
          choices: Array<{ message: { content: string } }>;
          usage: { prompt_tokens: number; completion_tokens: number };
        };

        return {
          text: data.choices[0]?.message.content ?? '',
          inputTokens: data.usage.prompt_tokens,
          outputTokens: data.usage.completion_tokens,
          model: this.model,
        };
      } catch (error) {
        clearTimeout(timeout);
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * (attempt + 1));
          continue;
        }
        throw error;
      }
    }

    throw new Error('DeepSeek API: max retries exceeded');
  }
}
