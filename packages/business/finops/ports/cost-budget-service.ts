/**
 * ACH-001 custos-finops: port para o serviço de controle de custo.
 *
 * Uma implementação Prisma+Redis ficará em
 * `../adapters/prisma-redis-cost-budget-service.ts` (pendente — humano).
 *
 * O adapter real deverá:
 *   - Ler `Subscription.monthlyCostBudgetUSD` (coluna a criar em ACH-002).
 *   - Escrever `Subscription.monthlyCostAccumulatedUSD` de forma atômica
 *     (optimistic update; ver ACH-001 dados-persistencia).
 *   - Emitir eventos outbox `AI_COST_WARNING` / `AI_COST_BLOCKED`.
 *   - Consultar `KILL_SWITCH.*` (ver @wbc/shared/feature-flags) antes de
 *     devolver decisão (kill-switch global sobrepõe o cálculo de budget).
 *
 * Call sites devem chamar `checkAndDeduct` ANTES de fazer a chamada paga.
 * Se a decisão for `block`, o use-case abortará. Se for `warn`, segue mas
 * loga; UI pode mostrar badge.
 */

import type {
  CostDecisionResult,
  CostBudgetSnapshot,
  CostProvider,
} from "../domain/cost-budget";

export interface CostBudgetService {
  /**
   * Checa se o tenant tem budget para uma chamada de `estimatedCostUsd` no
   * `provider`. Se sim, deduz imediatamente do accumulated (atomic) e
   * retorna `ok`/`warn`. Se não, retorna `block` sem deduzir.
   *
   * Chamadas devem ser sempre precedidas por este método. A estimativa
   * pode ser ajustada com `reconcile` após a resposta real do provider.
   */
  checkAndDeduct(input: {
    tenantId: string;
    provider: CostProvider;
    estimatedCostUsd: number;
  }): Promise<CostDecisionResult>;

  /**
   * Ajusta o valor debitado anteriormente quando o custo real retornado
   * pelo provider diverge da estimativa. Usa o mesmo `idempotencyKey`
   * para evitar double-count em retries.
   */
  reconcile(input: {
    tenantId: string;
    provider: CostProvider;
    actualCostUsd: number;
    idempotencyKey: string;
  }): Promise<void>;

  /**
   * Leitura pura — não altera estado. Serve a dashboards (ACH-004),
   * relatórios de pricing (ACH-008) e UI admin.
   */
  snapshot(input: {
    tenantId: string;
    provider: CostProvider;
  }): Promise<CostBudgetSnapshot>;
}

/**
 * Stub — usado em desenvolvimento e em testes de use-cases que não estão
 * testando a lógica de budget. Sempre aprova, acumula in-memory.
 *
 * **Jamais usar em produção.**
 */
export class InMemoryCostBudgetService implements CostBudgetService {
  private readonly accumulated = new Map<string, number>();

  async checkAndDeduct(input: {
    tenantId: string;
    provider: CostProvider;
    estimatedCostUsd: number;
  }): Promise<CostDecisionResult> {
    const key = `${input.tenantId}:${input.provider}`;
    const current = this.accumulated.get(key) ?? 0;
    const next = current + input.estimatedCostUsd;
    this.accumulated.set(key, next);
    return {
      decision: "ok",
      snapshot: {
        tenantId: input.tenantId,
        provider: input.provider,
        period: new Date().toISOString().slice(0, 7),
        budgetUsd: Number.POSITIVE_INFINITY,
        accumulatedUsd: next,
        remainingUsd: Number.POSITIVE_INFINITY,
        blocked: false,
      },
      reason: "in-memory stub — sempre aprova",
    };
  }

  async reconcile(): Promise<void> {
    // no-op em dev stub
  }

  async snapshot(input: {
    tenantId: string;
    provider: CostProvider;
  }): Promise<CostBudgetSnapshot> {
    const key = `${input.tenantId}:${input.provider}`;
    const accumulated = this.accumulated.get(key) ?? 0;
    return {
      tenantId: input.tenantId,
      provider: input.provider,
      period: new Date().toISOString().slice(0, 7),
      budgetUsd: Number.POSITIVE_INFINITY,
      accumulatedUsd: accumulated,
      remainingUsd: Number.POSITIVE_INFINITY,
      blocked: false,
    };
  }
}
