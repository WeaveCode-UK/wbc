import type { AIProvider, AIGenerateResult } from '../ports/ai-provider';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

export class DeepSeekAdapter implements AIProvider {
  private readonly apiKey: string;
  private readonly model: string;

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY ?? '';
    this.model = 'deepseek-chat';
  }

  async generate(prompt: string): Promise<AIGenerateResult> {
    if (!this.apiKey) {
      // Dev fallback
      return {
        text: `[DEV] Generated text for prompt: ${prompt.substring(0, 50)}...`,
        inputTokens: prompt.length,
        outputTokens: 50,
        model: this.model,
      };
    }

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
    });

    if (!response.ok) {
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
  }
}
