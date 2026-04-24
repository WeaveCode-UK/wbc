# FinOps — Observabilidade de custos

> Contexto: `Auditoria/custos-finops/runs/2026-04-19_21-19-13/achados.md#ACH-004`. Hoje, a descoberta de overspend acontece **via fatura do mês seguinte**, que é tarde demais. Sem métricas Prometheus, sem dashboards Grafana e sem alertas, um tenant pode consumir 10x o esperado em DeepSeek ou WhatsApp antes de qualquer humano notar.

## Entregáveis desta correção (parcial)

- `deploy/alerts.yml`: grupo novo `wbc-finops-alerts` com 4 regras:
  - `TenantBudget80PctReached` (warning).
  - `TenantBudgetExhausted` (critical).
  - `GlobalCostSpike` (warning, heurística 2x vs mesma hora ontem).
  - `ReconciliationDivergence` (warning, > 5%).

As regras **não disparam hoje** porque as métricas (`wbc_tenant_monthly_cost_usd`, `wbc_tenant_monthly_cost_budget_usd`, `wbc_reconciliation_diff_abs_pct`) ainda não são emitidas pelo código. Assim que `ACH-001` (CostBudgetService) e `ACH-010` (Reconciliation) estiverem implementados, as regras passam a funcionar sem mais alterações.

## Métricas a emitir (pendente — humano)

### 1. Budget & acumulado por tenant

Emitidas por `CostBudgetService` (ACH-001) no intervalo de 30s via `prom-client`:

```
wbc_tenant_monthly_cost_usd{tenant, provider, period} gauge
wbc_tenant_monthly_cost_budget_usd{tenant, provider, period} gauge
wbc_tenant_monthly_cost_remaining_usd{tenant, provider, period} gauge
```

### 2. Custo acumulado global

Agregação rolling window (last 24h) via recording rule no Prometheus:

```yaml
# deploy/prometheus-recording.yml (a criar)
- record: wbc_tenant_cost_usd_total
  expr: sum by (provider) (wbc_tenant_monthly_cost_usd)
```

### 3. Reconciliação

Emitida pelo `reconciliation-runner` (ACH-010) após cada rodada:

```
wbc_reconciliation_diff_usd{provider, period} gauge
wbc_reconciliation_diff_abs_pct{provider, period} gauge
wbc_reconciliation_status{provider, period, status="matched|divergent"} gauge
```

### 4. Kill-switch status (observabilidade operacional)

Do `feature-flags.ts`:

```
wbc_kill_switch_enabled{switch="deepseek|whatsapp|sentry"} gauge  // 0/1
```

## Dashboards Grafana (pendente)

### Dashboard 1 — "FinOps por Tenant"

Rows:

1. **Top 10 tenants por spend do mês** — table com tenant, plano, provider, USD, % do budget.
2. **Tenants em warning (> 80% budget)** — alertlist.
3. **Heatmap de consumo** — tenant × dia, cor = USD.
4. **Eventos de cost blocked nas últimas 24h** — logs do outbox `AI_COST_BLOCKED`.

### Dashboard 2 — "FinOps Global"

Rows:

1. **Spend total por provider (últimos 30 dias)** — stacked area.
2. **Reconciliação — snapshot vs fatura (6 meses)** — time series.
3. **Kill-switches status** — stat panel (DEEPSEEK/WHATSAPP/SENTRY ligado?).
4. **Tenants ativos vs budget médio** — pie + mean.

### Dashboard 3 — "FinOps por Provider"

Um por provider (DeepSeek, WhatsApp, Sentry). Decomposição:

- Spend × horário do dia (detectar loops acidentais).
- Top 10 tenants para este provider.
- Breakdown por categoria (utility/marketing/service em WhatsApp).

Dashboards JSON devem viver em `deploy/grafana/dashboards/finops-*.json` (provisionados — cross-ref `observabilidade-operacao/ACH-008`).

## Prometheus scrape config

O `deploy/prometheus.yml` já faz scrape de `apps/web` e `apps/api`. Não precisa de endpoint novo — as métricas `wbc_tenant_*` saem no mesmo `/metrics` dos serviços existentes.

## Alertmanager routing

Em `deploy/alertmanager.yml`, adicionar rota para o `category: finops`:

```yaml
# pseudo — pendente
routes:
  - match:
      category: finops
    receiver: "slack-finops"
    group_wait: 30s
    group_interval: 5m
    repeat_interval: 6h
```

Canal `#alerts-finops` no Slack recebe notificações de budget/reconciliação; mensagens críticas (`severity: critical`) mencionam o on-call.

## Relatório semanal (pendente)

Worker `apps/worker/src/processors/finops-weekly-digest.ts` (cron segunda 09:00 BRT):

1. Agrega `TenantCostSnapshot` da semana.
2. Lista top-10 tenants, delta vs semana anterior, % da fatura projetada.
3. Posta no `#alerts-finops` via webhook Slack.

Formato:

```
📊 FinOps — Semana 2026-04-21 a 2026-04-27

Spend total:     US$ 234.56 (+8% vs semana passada)
  DeepSeek:      US$ 12.40
  WhatsApp:      US$ 218.16
  Sentry:        US$ 4.00

Top 5 tenants:
  1. ACME Beauty   US$ 18.40  (PRO,  67% budget)
  2. Bella Salon   US$ 12.20  (PRO,  42% budget)
  ...

Tenants em alerta (>80% budget):
  - Glamour Studio  94% → considerar contato proativo

Divergências de reconciliação (>5%):
  - WhatsApp 2026-04: diff +US$ 3.20 (+2.1%) [within tolerance]
```

## Cross-reference

- Achado origem: `Auditoria/custos-finops/runs/2026-04-19_21-19-13/achados.md#ACH-004`
- Métricas emitidas por: `docs/FINOPS-KILL-SWITCH.md` (ACH-001).
- Reconciliação: `docs/FINOPS-COST-RECONCILIATION.md` (ACH-010).
- Dashboards: `observabilidade-operacao/ACH-008` (provisioning Grafana).
- Alertmanager: `docs/FINOPS-OBSERVABILITY.md` (este doc).
