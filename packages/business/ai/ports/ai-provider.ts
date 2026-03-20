export interface AIGenerateResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

export interface AIProvider {
  generate(prompt: string): Promise<AIGenerateResult>;
}
