export interface AIUsage {
  used: number;
  limit: number;
  remaining: number;
}

export interface AIRepository {
  getUsage(tenantId: string): Promise<AIUsage>;
  checkLimit(tenantId: string): Promise<void>;
  recordGeneration(tenantId: string, type: string, inputTokens: number, outputTokens: number, model: string, prompt: string, result: string): Promise<void>;
}
