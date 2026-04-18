// Erros de domínio do módulo ai/ — skeleton pelo ACH-006.

export class AILimitExceededError extends Error {
  constructor(
    public readonly consumedTokens: number,
    public readonly maxTokensPerPeriod: number,
  ) {
    super(
      `AI token budget exceeded: consumed=${consumedTokens} max=${maxTokensPerPeriod}`,
    );
    this.name = "AILimitExceededError";
  }
}

export class AIProviderUnavailableError extends Error {
  constructor(public readonly providerName: string) {
    super(`AI provider unavailable: ${providerName}`);
    this.name = "AIProviderUnavailableError";
  }
}
