# FinOps — Limites por plano

> Contexto: `Auditoria/custos-finops/runs/2026-04-19_21-19-13/achados.md#ACH-002`. O schema atual (`Subscription.aiGenerationsLimit`) trata o limite como constante — 30 gerações para ambos ESSENTIAL e PRO. Não há diferenciação de quota nem budget em USD.

## Problema

1. **Pricing descasado dos limites:** consultora PRO paga mais mas tem a mesma quota de IA que ESSENTIAL.
2. **Sem budget em USD:** todos os limites são "count" (número de gerações). Custo real em dólares pode explodir se prompts ficarem mais caros (prompt poisoning, maior output).
3. **Sem extensão para WhatsApp / outros providers:** `Subscription` não modela outros custos por tenant.

## Alvo

Schema final (direção — pendente de migration humana):

```prisma
model Subscription {
  id                         String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId                   String    @unique @db.Uuid
  plan                       Plan
  status                     SubStatus @default(ACTIVE)
  startsAt                   DateTime
  expiresAt                  DateTime?

  // ─── Quotas de uso (count) ─────────────────────────────────
  aiGenerationsUsed          Int       @default(0)
  aiGenerationsLimit         Int       // agora setado por plan, ver PlanQuota abaixo

  // ─── Custos em USD (ACH-002 custos-finops) ────────────────
  monthlyCostBudgetUSD       Decimal   @default(5.00) @db.Decimal(10, 2)
  monthlyCostAccumulatedUSD  Decimal   @default(0.00) @db.Decimal(10, 2)
  monthlyCostBlockedAt       DateTime?

  // ─── Billing cycle ────────────────────────────────────────
  billingCycleStart          DateTime  // primeiro dia do ciclo atual
  billingCycleEnd            DateTime  // último dia

  version                    Int       @default(0)
  createdAt                  DateTime  @default(now())
  updatedAt                  DateTime  @updatedAt

  tenant  Tenant  @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@map("subscriptions")
}

/// ACH-002 custos-finops: quotas centralizadas por plano.
/// Seed único; leitura via PlanQuotaService.
model PlanQuota {
  id                         String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  plan                       Plan      @unique
  aiGenerationsLimit         Int
  whatsappUtilityLimit       Int
  whatsappMarketingLimit     Int
  clientsLimit               Int
  usersLimit                 Int
  workspacesLimit            Int
  defaultMonthlyCostBudgetUSD Decimal  @db.Decimal(10, 2)
  updatedAt                  DateTime  @updatedAt

  @@map("plan_quotas")
}
```

Valores iniciais sugeridos (ver `docs/PRICING.md` seção 2):

| Plano     | aiGen | WA utility | WA marketing | Clients | Users | Workspaces | Budget USD |
| --------- | ----- | ---------- | ------------ | ------- | ----- | ---------- | ---------- |
| ESSENTIAL | 30    | 500        | 0            | 500     | 1     | 1          | 1.00       |
| PRO       | 300   | 3000       | 1000         | 5000    | 5     | 3          | 10.00      |

## Por que esta correção é parcial

O agente de auditoria **não emite migrations SQL** (produção já tem dados).
Uma migration que adiciona `monthlyCostBudgetUSD NOT NULL` com default precisa:

1. Migration additive: adicionar coluna nullable, popular, flipar para NOT NULL.
2. Data migration para criar `PlanQuota` seeds.
3. Refactor em `prisma-subscription-repository.ts` para ler limit de `PlanQuota` em vez de `Subscription`.
4. Ajustes em use-cases de incremento (ACH-001 dados-persistencia) para também decrementar `monthlyCostBudgetUSD`.

Todas essas etapas exigem coordenação humana (staging first, backfill script, smoke tests). Por isso: **seed + doc agora; implementação humano**.

## Roadmap

- [ ] Semana 1: criar migration additive para `PlanQuota` model + seeds.
- [ ] Semana 2: `PlanQuotaService` + refactor de leitura dos limites.
- [ ] Semana 3: adicionar campos de budget USD em `Subscription` (nullable), backfill com `defaultMonthlyCostBudgetUSD`.
- [ ] Semana 4: flipar para NOT NULL; integrar com `CostBudgetService` (ACH-001).

## Monitoramento pós-launch

Métricas Prometheus (ACH-004):

- `tenant_ai_generations_used{tenant, plan}` / `tenant_ai_generations_limit{tenant, plan}` → utilização da quota.
- `tenant_monthly_cost_accumulated_usd{tenant, plan}` / `tenant_monthly_cost_budget_usd{tenant, plan}` → utilização do budget.

Alerta se um tenant atinge 80% do budget antes do dia 20 do ciclo.

## Cross-reference

- Achado origem: `Auditoria/custos-finops/runs/2026-04-19_21-19-13/achados.md#ACH-002`
- Pricing: `docs/PRICING.md`
- Kill-switch: `docs/FINOPS-KILL-SWITCH.md` (ACH-001)
- Reconciliação: `docs/FINOPS-COST-RECONCILIATION.md` (ACH-010)
