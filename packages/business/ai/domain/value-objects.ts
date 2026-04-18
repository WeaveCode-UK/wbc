// Value-objects do módulo ai/ — skeleton pelo ACH-006.
// Regras puras sobre quota e consumo; ver docs/adr/006-ai-module-model.md.

import type { AILimit, AIUsage } from "./entities";

/** Total de tokens (input + output) consumidos numa janela de tempo. */
export function totalTokensInWindow(
  usages: readonly AIUsage[],
  windowStart: Date,
  windowEnd: Date = new Date(),
): number {
  return usages
    .filter((u) => u.timestamp >= windowStart && u.timestamp <= windowEnd)
    .reduce((sum, u) => sum + u.inputTokens + u.outputTokens, 0);
}

/** Retorna true se o limite ainda tem orçamento; false se excedeu. */
export function isWithinLimit(
  limit: AILimit,
  consumedTokensInWindow: number,
): boolean {
  return consumedTokensInWindow < limit.maxTokensPerPeriod;
}
