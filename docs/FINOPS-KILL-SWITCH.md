# FinOps — Kill-switch financeiro (CostBudgetService)

> Contexto: `Auditoria/custos-finops/runs/2026-04-19_21-19-13/achados.md#ACH-001`. Hoje não existe freio financeiro por tenant antes das chamadas pagas a DeepSeek e WhatsApp. `aiGenerationsUsed < limit` é um contador racy (flagged pelo ACH-001 dados-persistencia) e não considera USD. Um tenant pode disparar um loop de chamadas caras até o dono notar via fatura.

## Entregáveis desta correção (seed, parcial)

- `packages/business/finops/domain/cost-budget.ts` — tipos de domínio (`CostBudgetSnapshot`, `CostDecision`).
- `packages/business/finops/ports/cost-budget-service.ts` — interface `CostBudgetService` + `InMemoryCostBudgetService` (stub dev-only).
- `packages/business/finops/index.ts` — barrel de exportações.

## O que falta (humano)

### 1. Migration do schema (depende de ACH-002)

A interface pressupõe que `Subscription` tem `monthlyCostBudgetUSD` e `monthlyCostAccumulatedUSD`. Essas colunas saem da migration descrita em `docs/FINOPS-PLAN-LIMITS.md`.

### 2. Adapter real

`packages/business/finops/adapters/prisma-redis-cost-budget-service.ts`:

- Lê budget de `Subscription`.
- Escreve accumulated com optimistic lock (via `optimisticUpdate` em `@wbc/shared`).
- Publica eventos via outbox:
  - `AI_COST_WARNING { tenantId, provider, thresholdUsd, accumulatedUsd }` — emitido quando cruza 80% do budget.
  - `AI_COST_BLOCKED { tenantId, provider, periodEnd }` — emitido quando esgota.
- Idempotência de `reconcile` via chave única em Redis (`finops:reconcile:<idempotencyKey>` com TTL do ciclo).

### 3. Integração nos adapters

#### DeepSeek (`packages/business/ai/adapters/deepseek-adapter.ts`)

```ts
// pseudo — pendente
import { CostBudgetService } from "@wbc/business/finops";
import { flag, KILL_SWITCH } from "@wbc/shared";

class DeepSeekAdapter {
  constructor(
    private readonly costBudget: CostBudgetService,
    // ... demais deps
  ) {}

  async generate(tenantId: string, prompt: string) {
    if (!flag(KILL_SWITCH.DEEPSEEK, true)) {
      return this.offlineFallback();
    }

    const estimate = this.estimateCost(prompt); // ~US$ 0.0006 médio
    const check = await this.costBudget.checkAndDeduct({
      tenantId,
      provider: "deepseek",
      estimatedCostUsd: estimate,
    });

    if (check.decision === "block") {
      return { error: "cost_budget_exhausted", snapshot: check.snapshot };
    }

    const response = await this.callDeepSeek(prompt);
    // custo real pode divergir — reconcilia
    await this.costBudget.reconcile({
      tenantId,
      provider: "deepseek",
      actualCostUsd: this.computeActualCost(response),
      idempotencyKey: response.id,
    });

    return response;
  }
}
```

#### WhatsApp (`packages/business/messaging/adapters/whatsapp-n2-adapter.ts`)

Análogo; tabela de custos por categoria em `docs/PRICING.md` seção 3.1.

### 4. Override manual (admin)

Um admin deve poder "destrancar" um tenant antes do fim do ciclo (caso legítimo).

- Endpoint tRPC `admin.cost.unblock { tenantId, additionalBudgetUsd }`.
- Audit-log obrigatório (`ADMIN_COST_OVERRIDE` via `AuthAuditLog`).

### 5. UI

- Dashboard `/admin/finops` — lista de tenants por % do budget consumido.
- Widget no tenant settings — "você usou US$ X de US$ Y este mês".

## Eventos outbox (schemas-alvo)

Ficam em `packages/shared/src/events/schemas/finops.ts` (a criar):

```ts
export const AiCostWarningSchema = z.object({
  tenantId: z.string().uuid(),
  provider: z.enum(["deepseek", "whatsapp", "sentry"]),
  period: z.string().regex(/^\d{4}-\d{2}$/),
  thresholdPct: z.number(), // 0.8 = 80%
  accumulatedUsd: z.number(),
  budgetUsd: z.number(),
});

export const AiCostBlockedSchema = z.object({
  tenantId: z.string().uuid(),
  provider: z.enum(["deepseek", "whatsapp", "sentry"]),
  period: z.string().regex(/^\d{4}-\d{2}$/),
  accumulatedUsd: z.number(),
  budgetUsd: z.number(),
});
```

## Testing

- Unit: `InMemoryCostBudgetService` + cenários edge (budget=0, accumulated > budget, reconcile com idempotency duplicada).
- Integration: adapter Prisma real contra Postgres local, com concorrência (2 checkAndDeduct simultâneos devem falhar um — optimistic lock).
- E2E: fluxo de geração IA com tenant próximo do limite, verificar que recebe `warn` e depois `block`.

## Prazos sugeridos

- Semana 1: schema migration (ACH-002 dependency) + adapter Prisma/Redis.
- Semana 2: integração em DeepSeekAdapter + testes.
- Semana 3: integração em WhatsAppAdapter.
- Semana 4: UI admin + override manual + audit log.

## Cross-reference

- Achado origem: `Auditoria/custos-finops/runs/2026-04-19_21-19-13/achados.md#ACH-001`
- Plan limits: `docs/FINOPS-PLAN-LIMITS.md` (ACH-002)
- Observabilidade: `docs/FINOPS-OBSERVABILITY.md` (ACH-004)
- Reconciliação: `docs/FINOPS-COST-RECONCILIATION.md` (ACH-010)
- Kill-switches (global): `docs/FEATURE-FLAGS-FOLLOWUP.md` (ACH-012)
