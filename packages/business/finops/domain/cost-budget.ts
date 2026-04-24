/**
 * ACH-001 custos-finops: tipos de domínio para controle de custo por tenant.
 *
 * Esta é a camada pura (hexagonal). Não importa Prisma, Redis, HTTP.
 * Apenas define a forma do problema: quanto este tenant já gastou, quanto
 * está autorizado a gastar, e qual decisão tomar diante de uma nova chamada
 * paga.
 *
 * Ver ports em `../ports/cost-budget-service.ts` e doc em
 * `docs/FINOPS-KILL-SWITCH.md`.
 */

/**
 * Providers cujo custo é rastreado por tenant. Alinhado com o schema
 * `PlanQuota` (ACH-002) e com os kill-switches (ACH-012).
 */
export type CostProvider = "deepseek" | "whatsapp" | "sentry";

/**
 * Snapshot do orçamento mensal do tenant para um provider.
 * Produzido por `CostBudgetService.snapshot`.
 */
export interface CostBudgetSnapshot {
  tenantId: string;
  provider: CostProvider;
  /** ISO `YYYY-MM` do ciclo atual. */
  period: string;
  /** Budget total autorizado para o período (USD). */
  budgetUsd: number;
  /** Quanto já foi debitado no período (USD). */
  accumulatedUsd: number;
  /** `budgetUsd - accumulatedUsd`, nunca negativo. */
  remainingUsd: number;
  /** true quando accumulatedUsd >= budgetUsd. */
  blocked: boolean;
}

/**
 * Decisão do serviço frente a uma chamada proposta.
 * - `ok`: seguir normalmente.
 * - `warn`: seguir, mas tenant passou 80% do budget — logar/alertar.
 * - `block`: bloquear; cost budget esgotado (ou kill-switch ativo).
 */
export type CostDecision = "ok" | "warn" | "block";

export interface CostDecisionResult {
  decision: CostDecision;
  snapshot: CostBudgetSnapshot;
  reason?: string;
}
