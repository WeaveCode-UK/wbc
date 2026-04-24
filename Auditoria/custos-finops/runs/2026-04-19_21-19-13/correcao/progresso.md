# Progresso da Correção

## Identificação
- dominio: custos-finops
- run_id: 2026-04-19_21-19-13
- branch: fix/custos-finops/2026-04-19_21-19-13
- data_inicio: 2026-04-23 23:15:04
- ultima_atualizacao: 2026-04-23 23:45:00
- fase_atual: revisor
- status: revisor_concluido

## Resumo de Progresso
- total_aprovados: 14
- corrigidos_executor: 14
- revisados_revisor: 14
- corrigidos_pelo_revisor: 0
- nao_corrigiveis: 0
- nao_aprovados: 0
- pendentes: 0

## Achados

### ACH-001
- titulo: Kill-switch financeiro por tenant ausente
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: dddaf46
- commit_revisor: none
- arquivos_alterados:
  - packages/business/finops/domain/cost-budget.ts
  - packages/business/finops/ports/cost-budget-service.ts
  - packages/business/finops/index.ts
  - docs/FINOPS-KILL-SWITCH.md
- descricao_correcao: seed de domínio (CostBudgetSnapshot, CostDecision), ports (CostBudgetService, InMemoryCostBudgetService), barrel + doc completo com adapter real, integração em DeepSeek/WhatsApp, eventos AI_COST_WARNING/BLOCKED, override admin, UI
- observacoes: adapter Prisma+Redis + integrações em adapters + UI admin ficam como trabalho humano (parcial)
- nota_revisor: domain pura (sem Prisma/Redis), CostProvider/CostDecision/CostBudgetSnapshot bem tipados; port CostBudgetService com checkAndDeduct/reconcile/snapshot (nomes alinhados com a recomendação); InMemoryCostBudgetService explícito como dev-only; barrel em finops/index.ts exporta domain + ports; doc FINOPS-KILL-SWITCH.md presente com roadmap. Parcial esperado.

### ACH-002
- titulo: Limites IA iguais ESSENTIAL/PRO
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 49f082f
- commit_revisor: none
- arquivos_alterados:
  - docs/FINOPS-PLAN-LIMITS.md
  - packages/db/prisma/schema.prisma (comentário em Subscription)
- descricao_correcao: doc com schema-alvo (PlanQuota + monthlyCostBudgetUSD), valores por plano, roadmap 4 semanas; schema.prisma ganha comentário em aiGenerationsLimit apontando para o doc
- observacoes: migration SQL + backfill + refactor do repositório fica para humano — produção tem dados (parcial)
- nota_revisor: schema.prisma ganhou comentário de 3 linhas em aiGenerationsLimit apontando para PlanQuota + monthlyCostBudgetUSD + doc; nenhuma mudança estrutural no modelo (correto, produção tem dados). Doc FINOPS-PLAN-LIMITS.md criada. Parcial esperado.

### ACH-003
- titulo: WhatsApp sem custo por tenant
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 5b66b20
- commit_revisor: none
- arquivos_alterados:
  - packages/business/messaging/ports/message-billing.ts
  - docs/FINOPS-WHATSAPP-BILLING.md
- descricao_correcao: port MessageBillingPort + MessageBillingEvent + WhatsAppConversationCategory; doc cobre adapter outbox, integração WhatsAppN2Adapter, tabela preços Meta, agregação worker, schema Prisma (MessageCost + TenantMonthlyWhatsAppCost), privacidade
- observacoes: adapter real + integração + migration ficam para humano (parcial)
- nota_revisor: WhatsAppConversationCategory cobre as 4 categorias Meta (utility/marketing/service/authentication), MessageBillingEvent tem messageId + toPhoneRedacted (PII consciente), MessageBillingPort.record() com contrato idempotente descrito; NoopMessageBillingPort stub explícito. Parcial esperado.

### ACH-004
- titulo: Observabilidade de custo ausente
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: fe84f86
- commit_revisor: none
- arquivos_alterados:
  - deploy/alerts.yml
  - docs/FINOPS-OBSERVABILITY.md
- descricao_correcao: novo grupo wbc-finops-alerts com 4 regras (Budget80%, BudgetExhausted, GlobalCostSpike, ReconciliationDivergence); doc cobre métricas Prometheus a emitir, 3 dashboards Grafana, alertmanager routing, digest semanal Slack
- observacoes: regras só disparam quando ACH-001/010 emitirem as métricas; dashboards JSON + webhook Slack ficam para humano (parcial)
- nota_revisor: grupo wbc-finops-alerts adicionado ao final de alerts.yml (não conflita com existentes); 4 alertas com labels severity/category=finops + runbook_url apontando para docs correspondentes; header do grupo documenta explicitamente que métricas wbc_tenant_cost_* só existirão após ACH-001/003 (comportamento esperado "silêncio" até lá — intencional e documentado). Parcial esperado.

### ACH-005
- titulo: Sentry sampling generoso sem beforeSend filtro
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: ba6fc7f
- commit_revisor: none
- arquivos_alterados:
  - packages/shared/src/sentry-noise-filter.ts
  - packages/shared/src/index.ts
  - apps/web/sentry.client.config.ts
  - apps/web/sentry.server.config.ts
  - apps/api/src/lib/sentry.ts
- descricao_correcao: filterCostNoise() descarta 404/401/ETIMEDOUT/ECONNRESET/AbortError/ChunkLoadError/ResizeObserverLoopError; replaysOnErrorSampleRate 1.0→0.3; tracesSampleRate default 0.3→0.1; beforeSend plugado em web/client, web/server, api
- observacoes: none
- nota_revisor: filtro cobre os 3 vetores (status_code, exception.type, exception.value + message regex); encadeamento beforeSend correto (filterCostNoise → null OU redactSentryEvent); sample rates consistentes com recomendação; web/client importa do path específico (evita async_hooks); barrel exporta o módulo novo.

### ACH-006
- titulo: DeepSeek sem fallback de custo
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 302f729
- commit_revisor: none
- arquivos_alterados:
  - docs/DEEPSEEK-FALLBACK.md
- descricao_correcao: doc cobrindo 3 camadas (Redis cache 24h/7d, template offline por categoria, Llama local opcional); unit economics (25% hit rate → economia ~US$ 4/mês por 100 tenants PRO)
- observacoes: implementação de cache e templates offline fica para humano (parcial)
- nota_revisor: doc único (sem código), diagnostica estado atual e descreve 3 camadas de fallback com riscos. Parcial esperado.

### ACH-007
- titulo: Sem política de retenção global
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 6a68408
- commit_revisor: none
- arquivos_alterados:
  - docs/DATA_RETENTION_POLICY.md (nova seção "Perspectiva de custo")
  - apps/worker/src/processors/outbox-cleanup.ts (cleanupFailedOutboxEvents)
  - apps/worker/src/index.ts (chamada do novo cleanup)
- descricao_correcao: doc extende com seção de partitioning + storage tiering; worker agora purga outbox FAILED além de PROCESSED; env OUTBOX_FAILED_RETENTION_DAYS default 30
- observacoes: demais workers pendentes (session-cleanup, otp-cleanup, inactive-client-anonymizer) são cross-ref a outro domínio
- nota_revisor: cleanupFailedOutboxEvents implementado com env OUTBOX_FAILED_RETENTION_DAYS (default 30, validação Number.isFinite), query filtra status=FAILED + processedAt antigo; worker/index.ts importa e chama no mesmo setInterval do cleanup de PROCESSED; comentário no código aponta ACH-007. Cross-ref para outros workers já registrada como out-of-scope.

### ACH-008
- titulo: Sem docs/PRICING.md
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: eb1acfe
- commit_revisor: none
- arquivos_alterados:
  - docs/PRICING.md
- descricao_correcao: planos ESSENTIAL vs PRO, quotas propostas, COGS detalhado (WhatsApp/DeepSeek/Sentry/infra/MP), pricing-alvo (R$ 69 ESSENTIAL / R$ 199 PRO) com margem ~57-60%, checklist de validação
- observacoes: none
- nota_revisor: doc (5.6 KB) cobre todos os itens da recomendação — planos, quotas, transaction fees MP, COGS por linha, margem alvo. Cabeçalho explicita validação humana ainda pendente para finalização dos números.

### ACH-009
- titulo: CI sem cache robusto
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 6af2abb
- commit_revisor: none
- arquivos_alterados:
  - .github/workflows/ci.yml
- descricao_correcao: env TURBO_TOKEN/TURBO_TEAM (Vercel free tier remote cache opt-in); actions/cache@v4 para .turbo em lint-and-typecheck e test (matrix), chave por lockfile hash + branch
- observacoes: TURBO_TOKEN/TURBO_TEAM ausentes = no-op (benign), segue usando cache local
- nota_revisor: env TURBO_TOKEN/TURBO_TEAM no topo do workflow (aplicado aos 2 jobs); actions/cache@v4 em lint-and-typecheck + test; keys incluem runner.os + lockfile hash + branch; restore-keys com fallback progressivo. YAML válido.

### ACH-010
- titulo: Sem CostSnapshot + reconciliação
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: f52ec51
- commit_revisor: none
- arquivos_alterados:
  - packages/business/finops/domain/cost-snapshot.ts
  - packages/business/finops/index.ts
  - docs/FINOPS-COST-RECONCILIATION.md
- descricao_correcao: seed TenantCostSnapshot/ProviderInvoice/ReconciliationResult; doc cobre arquitetura (snapshot interno × invoice externo), schemas Prisma, workers cost-snapshot-closer (dia 1) + reconciliation-runner (dia 5), fontes por provider, tolerância 5%
- observacoes: migrations + workers + webhook handlers ficam para humano (parcial)
- nota_revisor: types TenantCostSnapshot/ProviderInvoice/ReconciliationResult/ReconciliationStatus bem tipados (discriminated union para status), reutiliza CostProvider do ACH-001 (acoplamento correto); breakdown opcional por sub-categoria; barrel atualizado. Parcial esperado.

### ACH-011
- titulo: Sem estratégia DR com custo
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: f786d6a
- commit_revisor: none
- arquivos_alterados:
  - docs/DR-BACKUP-POLICY.md
- descricao_correcao: RPO ≤ 1h / RTO ≤ 4h; S3/GCS com lifecycle (Standard 30d → IA 90d → Glacier 1a); drill mensal; custo ~US$ 10-12/mês; roadmap 4 semanas
- observacoes: none
- nota_revisor: doc cobre RPO/RTO com justificativa, gap analysis do backup.sh atual (retenção/off-site/Redis/integridade/drill), estratégia proposta. Atende à recomendação.

### ACH-012
- titulo: Sem feature flags de emergência
- severidade: baixo
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: ef93391
- commit_revisor: none
- arquivos_alterados:
  - packages/shared/src/feature-flags.ts (KILL_SWITCH const)
  - docs/FEATURE-FLAGS-FOLLOWUP.md (seção Emergency kill-switches)
- descricao_correcao: constantes KILL_SWITCH.{DEEPSEEK, WHATSAPP, SENTRY, AI_GENERATIONS}; doc com tabela de efeitos, exemplo de integração, runbook de emergência
- observacoes: integração nos adapters fica para humano (parcial)
- nota_revisor: KILL_SWITCH as const com 4 nomes canônicos, KillSwitchName derivado do const (type-safe); docstring com exemplo de uso referenciando flag() existente; convenção `kill_switch.*` consistente. Parcial esperado.

### ACH-013
- titulo: CI sem paths-filter
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 1792539
- commit_revisor: none
- arquivos_alterados:
  - .github/workflows/ci.yml
- descricao_correcao: paths-ignore em push e pull_request para **/*.md, docs/**, Auditoria/**, .github/ISSUE_TEMPLATE/**, LICENSE
- observacoes: none
- nota_revisor: paths-ignore aplicado tanto em push quanto pull_request; padrões não escondem mudanças funcionais (apenas docs, Auditoria, issue templates, LICENSE). YAML válido, comentário explicativo.

### ACH-014
- titulo: Dev stack 24/7
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: bd016fc
- commit_revisor: none
- arquivos_alterados:
  - docs/DEVELOPMENT.md
- descricao_correcao: doc novo com seção "Economizando recursos locais" (docker compose stop, cron em VPS), baseline de medição
- observacoes: none
- nota_revisor: doc novo com seção de auto-shutdown (docker compose stop + start, crontab exemplo para VPS com horário BRT, observação de que prod não precisa pois usa unless-stopped); links cruzados para DR-BACKUP-POLICY e DATA_RETENTION_POLICY.
