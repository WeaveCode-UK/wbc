# Achados da Auditoria

## Identificação
- dominio: custos-finops
- run_id: 2026-04-19_21-19-13
- ultima_atualizacao: 2026-04-19 21:35:00

## Severidades / Status
- critico · alto · medio · baixo · informativo
- aberto · confirmado · mitigado · resolvido · aceito · nao_aplicavel

## Achados Registrados

### ACH-001
- titulo: Sem kill-switch financeiro por tenant para integrações pagas (DeepSeek, WhatsApp)
- severidade: alto
- categoria: controle-de-consumo
- status: confirmado
- resumo: Não há `CostBudgetService` consultado antes de chamar DeepSeek ou WhatsApp. Adapter DeepSeek só checa contador `aiGenerationsUsed < limit` (ACH-001 dados-persistencia identifica que esse incremento é racy). Nada em USD; nenhum circuit-breaker financeiro.

#### Evidencia
- arquivo_ou_area: packages/business/ai/adapters/deepseek-adapter.ts; packages/shared/src/circuit-breaker.ts (apenas rede)

#### Impacto
- tecnico: Tenant pode gerar grande volume de chamadas caras sem freio
- negocio: Burn rate descontrolado; fatura imprevisível

#### Recomendacao
- acao_sugerida: `CostBudgetService.checkAndDeduct(tenantId, provider, estimatedCostUsd)`; eventos `AI_COST_WARNING` / `AI_COST_BLOCKED`; override manual por admin
- prioridade: alta

---

### ACH-002
- titulo: Limites de IA iguais para ESSENTIAL e PRO
- severidade: alto
- categoria: pricing-e-unit-economics
- status: confirmado
- resumo: Schema trata `aiGenerationsLimit` como valor fixo (30) sem distinção por plano. PRO não oferece quota maior. Não há campos `aiGenerationsLimitEssential`/`aiGenerationsLimitPRO` nem `tenantAiCostQuotaUSD`.

#### Evidencia
- arquivo_ou_area: packages/db/prisma/schema.prisma (Subscription); packages/business/auth/adapters/prisma-subscription-repository.ts

#### Impacto
- tecnico: Pricing descasado dos custos
- negocio: Margem incerta; PRO sem benefício claro

#### Recomendacao
- acao_sugerida: Separar limites por plano; introduzir `monthlyCostBudgetUSD`; documentar em `docs/PRICING.md` com COGS
- prioridade: alta

---

### ACH-003
- titulo: WhatsApp sem métrica de custo por tenant (impossibilita unit economics)
- severidade: alto
- categoria: alocacao-de-custo
- status: confirmado
- resumo: Nenhum modelo registra `WhatsappMessageCost` por tenant. `whatsapp-n2-adapter.ts` envia mensagens sem produzir evento com custo unitário. WhatsApp cobra por categoria (utility, marketing, service); WBC não conseguiria ratear fatura.

#### Evidencia
- arquivo_ou_area: packages/business/messaging/adapters/whatsapp-n2-adapter.ts; schema.prisma (sem MessageCost)

#### Impacto
- tecnico: Sem alocação de custo por tenant
- negocio: Impossível auditar lucro por cliente

#### Recomendacao
- acao_sugerida: Coluna `whatsappMessagesUsed`/`whatsappCostCents` em Subscription; evento outbox `MessageBilled`; agregação diária + reconciliação com fatura Meta
- prioridade: alta

---

### ACH-004
- titulo: Observabilidade de custo ausente — sem métricas Prometheus, sem dashboards, sem alerta
- severidade: alto
- categoria: observabilidade-finops
- status: confirmado
- resumo: `deploy/alerts.yml` não define alertas financeiros. `deploy/prometheus.yml` não coleta métricas de custo. Grafana sem dashboard de "spend por provider/tenant" (cross-ref observabilidade/ACH-002).

#### Evidencia
- arquivo_ou_area: deploy/alerts.yml; deploy/prometheus.yml

#### Impacto
- tecnico: Descoberta de overspend só via fatura
- negocio: Risco financeiro não controlado

#### Recomendacao
- acao_sugerida: Métricas `tenant_monthly_cost_usd{provider,tenant}`, alertas (`>80%` do budget), dashboards Grafana; relatório semanal via Slack
- prioridade: alta

---

### ACH-005
- titulo: Sentry com sampling generoso sem `beforeSend` (potencial excesso no free tier)
- severidade: alto
- categoria: custo-observabilidade
- status: confirmado
- resumo: Client replays 100% em erros, traces 0.3 API e 0.1 worker; sem filtro/beforeSend. Em produção com carga, pode estourar free tier Sentry rapidamente (além do risco de PII já registrado em seguranca/ACH-021).

#### Evidencia
- arquivo_ou_area: apps/web/sentry.{client,server}.config.ts; apps/api/src/lib/sentry.ts

#### Impacto
- tecnico: Upgrade forçado ou perda de eventos
- negocio: Custo inesperado

#### Recomendacao
- acao_sugerida: `beforeSend` rejeitando 404s/timeouts; reduzir `replaysOnErrorSampleRate` para 0.3; unificar sample entre apps
- prioridade: alta

---

### ACH-006
- titulo: DeepSeek sem fallback de custo — indisponibilidade ⇒ perda de feature sem alternativa barata
- severidade: medio
- categoria: otimizacao
- status: confirmado
- resumo: Circuit breaker abre e fallback é string estática ou erro; sem cache de resposta anterior nem template offline. Perda de feature (e receita) sem fallback.

#### Evidencia
- arquivo_ou_area: packages/business/ai/adapters/deepseek-adapter.ts

#### Impacto
- tecnico: Feature degrada para erro duro
- negocio: Risco de churn

#### Recomendacao
- acao_sugerida: Cache Redis de resultados recentes; template local (mock) com aviso; ou fallback a modelo mais barato
- prioridade: media

---

### ACH-007
- titulo: Postgres/Redis sem política de retenção global; disco cresce indefinidamente
- severidade: medio
- categoria: storage-e-custo
- status: confirmado
- resumo: Sem `docs/DATA_RETENTION_POLICY.md`. Apenas outbox cleanup de PROCESSED. Clients inativos, Sales antigas, logs e OTP consumidos permanecem. Redis 256 MB com LRU (contenção).

#### Evidencia
- arquivo_ou_area: docker-compose.prod.yml; apps/worker/src/processors/outbox-cleanup.ts; cross-ref dados-persistencia/ACH-017/019

#### Impacto
- tecnico: Storage cresce; backup cresce
- negocio: Custo de VPS escalando

#### Recomendacao
- acao_sugerida: Política por entidade (Clients inativos > 2a → arquivar, OTP > 1h → purge, Outbox FAILED > 7d → purge); partitioning em Sales/Campaign
- prioridade: media

---

### ACH-008
- titulo: Sem `docs/PRICING.md` nem documentação de COGS/unit economics
- severidade: medio
- categoria: governanca-financeira
- status: confirmado
- resumo: Planos ESSENTIAL/PRO existem no schema, mas sem documento público/interno explicando custos, margens, diferenciação e incentivos.

#### Evidencia
- arquivo_ou_area: docs/ (vazio quanto a pricing)

#### Impacto
- tecnico: Decisões de produto sem base financeira
- negocio: Pricing pode vender abaixo do custo

#### Recomendacao
- acao_sugerida: `docs/PRICING.md` com planos, quotas, transaction fees (MP), COGS por linha, margem alvo
- prioridade: media

---

### ACH-009
- titulo: GitHub Actions não usa cache robusto; build pode exceder minutos do free tier
- severidade: medio
- categoria: ci-cost
- status: confirmado
- resumo: `ci.yml` usa pnpm/action-setup mas não cacheia `.next`, `node_modules` em nível de job, nem Turborepo remote cache. Instalações repetidas consomem minutos.

#### Evidencia
- arquivo_ou_area: .github/workflows/ci.yml

#### Impacto
- tecnico: Minutos mensais podem estourar
- negocio: Custos extras GitHub Actions

#### Recomendacao
- acao_sugerida: Cache explícito com `actions/cache@v4` por `pnpm-lock.yaml`; Turborepo Remote Cache (free tier 1GB) ou Nx Cloud; paralelismo em testes
- prioridade: media

---

### ACH-010
- titulo: Sem `CostSnapshot` table nem processo de reconciliação com faturas externas
- severidade: medio
- categoria: governanca-financeira
- status: confirmado
- resumo: Não há tabela que armazene snapshot mensal do custo por provider/tenant; sem reconciliação com faturas (WhatsApp, DeepSeek, Sentry, Resend). Impossível confirmar billing dos providers.

#### Evidencia
- arquivo_ou_area: schema.prisma (sem CostSnapshot/ProviderInvoice)

#### Impacto
- tecnico: Sem auditoria financeira
- negocio: Risco de cobrança indevida sem detecção

#### Recomendacao
- acao_sugerida: Modelo `TenantCostSnapshot { tenantId, provider, period, amountUsd }`; worker mensal; reconciliação com webhook/nota fiscal
- prioridade: media

---

### ACH-011
- titulo: Sem estratégia de backup/DR documentada com custo
- severidade: medio
- categoria: dr-e-custo
- status: confirmado
- resumo: Backups locais (`deploy/backup/backup.sh`) sem política de retenção versus custo off-site; RPO/RTO não documentados (cross-ref infra/ACH-003, dados-persistencia/ACH-018).

#### Evidencia
- arquivo_ou_area: deploy/backup/backup.sh; docs/DEPLOYMENT.md

#### Impacto
- tecnico: Restore custoso/arriscado
- negocio: Paralisação longa em DR

#### Recomendacao
- acao_sugerida: Backup diário S3/GCS com lifecycle; RPO ≤ 1h, RTO ≤ 4h documentados; drill mensal
- prioridade: media

---

### ACH-012
- titulo: Sem feature flags para desligar integrações pagas em emergência
- severidade: baixo
- categoria: otimizacao
- status: confirmado
- resumo: Sem mecanismo de kill switch global para DeepSeek, WhatsApp ou Sentry em caso de custos estourando (cross-ref infra/ACH-008).

#### Evidencia
- arquivo_ou_area: ausência de packages/shared/src/feature-flags.ts; sem Unleash/Growthbook

#### Impacto
- tecnico: Redução de custo exige redeploy
- negocio: Reação lenta a spikes

#### Recomendacao
- acao_sugerida: Feature flag system (Growthbook) com `enable-deepseek`, `enable-whatsapp`, etc.; fallback controlado
- prioridade: baixa

---

### ACH-013
- titulo: Sem controle de consumo de CI/Actions por branch/feature
- severidade: baixo
- categoria: ci-cost
- status: confirmado
- resumo: CI roda em qualquer push sem filtros; sem `paths-filter`/`paths-ignore` para docs/markdown; múltiplos workflows podem duplicar builds em monorepo.

#### Evidencia
- arquivo_ou_area: .github/workflows/ci.yml

#### Impacto
- tecnico: Minutos consumidos em mudanças não-funcionais
- negocio: Custo residual crescente

#### Recomendacao
- acao_sugerida: `paths-ignore` para .md, docs/; matrix por package alterado via Turborepo `--filter`
- prioridade: baixa

---

### ACH-014
- titulo: Dev stack rodando 24/7 sem auto-shutdown em não-produção
- severidade: baixo
- categoria: otimizacao
- status: confirmado
- resumo: `docker-compose.yml` (dev) não define `restart: "no"` nem shutdown agendado. VPS ou devs locais rodam serviços noite/fim de semana.

#### Evidencia
- arquivo_ou_area: docker-compose.yml

#### Impacto
- tecnico: CPU/RAM desperdiçados
- negocio: Custo marginal em ambiente de teste

#### Recomendacao
- acao_sugerida: Documentar `docker compose stop` em playbook de dev; se VPS compartilhada, shutdown à noite via cron
- prioridade: baixa
