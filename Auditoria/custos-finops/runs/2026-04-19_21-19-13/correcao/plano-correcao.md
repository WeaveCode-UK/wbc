# Plano de Correção — custos-finops

## Identificação
- dominio: custos-finops
- run_id: 2026-04-19_21-19-13
- data_geracao: 2026-04-23 23:15:04
- total_achados: 14
- corrigiveis: 7
- corrigiveis_parciais: 7
- nao_corrigiveis: 0

## Ordem de Execução

### Bloco A — Quick wins

### 1. ACH-005 — Sentry beforeSend + sampling reduzido
- severidade: alto
- classificacao: corrigivel
- arquivos: apps/web/sentry.client.config.ts, apps/web/sentry.server.config.ts, apps/api/src/lib/sentry.ts
- acao: beforeSend rejeita 404/timeouts; replaysOnErrorSampleRate 0.3; sample rates unificados

### 2. ACH-009 — actions/cache@v4 e Turborepo remote cache
- severidade: medio
- classificacao: corrigivel
- arquivos: .github/workflows/ci.yml
- acao: cache por pnpm-lock.yaml hash; env TURBO_TOKEN/TURBO_TEAM via secrets

### 3. ACH-013 — paths-ignore em CI
- severidade: baixo
- classificacao: corrigivel
- arquivos: .github/workflows/ci.yml
- acao: ignorar docs/**, **/*.md, Auditoria/**

### 4. ACH-014 — Auto-shutdown em dev (doc)
- severidade: baixo
- classificacao: corrigivel
- arquivos: docs/DEVELOPMENT.md
- acao: seção "Economizando recursos locais" com `docker compose stop` e cron opcional

### Bloco B — Docs de política

### 5. ACH-008 — docs/PRICING.md
- severidade: medio
- classificacao: corrigivel
- arquivos: docs/PRICING.md
- acao: planos ESSENTIAL/PRO, quotas, COGS, margem alvo, fees MP

### 6. ACH-011 — docs/DR-BACKUP-POLICY.md
- severidade: medio
- classificacao: corrigivel
- arquivos: docs/DR-BACKUP-POLICY.md
- acao: RPO/RTO, política de retenção (diária+semanal+mensal), lifecycle S3/GCS, drill mensal

### 7. ACH-007 — docs/DATA_RETENTION_POLICY.md + TODOs em outbox-cleanup
- severidade: medio
- classificacao: corrigivel
- arquivos: docs/DATA_RETENTION_POLICY.md; apps/worker/src/processors/outbox-cleanup.ts (comentários TODO)
- acao: política por entidade (Clients, OTP, Outbox, Sales/Campaign)

### 8. ACH-012 — Feature flags stub + doc
- severidade: baixo
- classificacao: corrigivel_parcial
- arquivos: packages/shared/src/feature-flags.ts; docs/FEATURE-FLAGS.md
- acao: interface FeatureFlagService + implementação in-memory; flags enable-deepseek, enable-whatsapp, enable-sentry. Migração para Growthbook/Unleash fica como roadmap

### Bloco C — Seed + docs arquiteturais (parciais)

### 9. ACH-006 — docs/DEEPSEEK-FALLBACK.md
- severidade: medio
- classificacao: corrigivel_parcial
- arquivos: docs/DEEPSEEK-FALLBACK.md
- acao: estratégia de cache Redis + template offline + modelo barato; implementação fica como roadmap

### 10. ACH-002 — Limites por plano
- severidade: alto
- classificacao: corrigivel_parcial
- arquivos: docs/FINOPS-PLAN-LIMITS.md; packages/db/prisma/schema.prisma (comentários em Subscription)
- acao: doc separando limites ESSENTIAL/PRO e budget USD; comentários no schema marcando campos futuros. Migration SQL fica para humano

### 11. ACH-001 — CostBudgetService (interface + doc)
- severidade: alto
- classificacao: corrigivel_parcial
- arquivos: packages/business/finops/cost-budget-service.ts (novo); docs/FINOPS-KILL-SWITCH.md
- acao: interface + stub + eventos AI_COST_WARNING/AI_COST_BLOCKED; integration em DeepSeek/WhatsApp adapters como TODO. Implementação real + UI admin humano

### 12. ACH-003 — WhatsApp billing port + doc
- severidade: alto
- classificacao: corrigivel_parcial
- arquivos: packages/business/messaging/ports/message-billing.ts (novo); docs/FINOPS-WHATSAPP-BILLING.md
- acao: interface MessageBillingPort; doc de estratégia (tabela de preços, coluna whatsappCostCents, evento outbox MessageBilled). Implementação real humano

### 13. ACH-010 — CostSnapshot interface + reconciliação
- severidade: medio
- classificacao: corrigivel_parcial
- arquivos: packages/business/finops/cost-snapshot.ts (novo); docs/FINOPS-COST-RECONCILIATION.md
- acao: interface TenantCostSnapshot; doc de worker mensal + webhook de fatura provider. Implementação humano

### 14. ACH-004 — Observabilidade finops
- severidade: alto
- classificacao: corrigivel_parcial
- arquivos: deploy/alerts.yml; deploy/prometheus.yml; docs/FINOPS-OBSERVABILITY.md
- acao: regras de alerta commented-out em alerts.yml (placeholder até que métricas existam); scrape /cost-metrics em prometheus.yml; doc explica que métricas custom dependem de ACH-001/003/010

## Achados Não Corrigíveis
Nenhum.

## Resumo
- Total a corrigir: 7
- Total parcial (requer validação humana): 7
- Total não corrigível: 0
- Estimativa de commits: 16 (14 achados + init + relatório)
