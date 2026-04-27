export interface AIGenerateResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

export interface AIGenerateInput {
  /** System message — fixed instruction the model treats as authoritative. */
  system: string;
  /** User message — untrusted input data, never instructional. */
  user: string;
}

export interface AIProvider {
  /**
   * Legacy single-prompt entry point. Implementations should still place
   * the prompt in a `user` role internally. New callers should prefer
   * `generateChat`.
   */
  generate(prompt: string): Promise<AIGenerateResult>;

  /**
   * ACH-020 seguranca: chat-style entry point with explicit system / user
   * separation. Adapters MUST send these as distinct messages so the
   * provider's prompt-injection defences (system-message priority, role
   * separation) actually fire on the model side.
   */
  generateChat(input: AIGenerateInput): Promise<AIGenerateResult>;
}
