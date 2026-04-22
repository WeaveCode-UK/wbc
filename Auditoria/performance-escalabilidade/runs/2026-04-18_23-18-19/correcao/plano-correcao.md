# Plano de Correção

## Identificação
- dominio: performance-escalabilidade
- run_id: 2026-04-18_23-18-19
- data_geracao: 2026-04-22 00:10:00
- total_achados: 30
- corrigiveis: 10
- corrigiveis_parciais: 19
- nao_corrigiveis: 1

## Ordem de Execução

### 1. ACH-015 — paginação page cap [medio, corrigivel]
- arquivo: packages/validators/src/common.ts (já entregue em apis-integracoes/ACH-018)
- acao: verificação + update da observação como "ja_resolvido_por_outra_run"

### 2. ACH-003 — initTracing silencioso [medio, corrigivel]
- arquivo: apps/api/src/lib/tracing.ts
- acao: em produção exigir env var (throw); em dev warn + log estruturado "tracing_enabled: false"

### 3. ACH-009 — outbox processor sem reentrância [alto, corrigivel]
- arquivo: apps/worker/src/index.ts; apps/worker/src/processors/outbox-processor.ts
- acao: flag `isProcessing` para evitar overlap; log estruturado se skip

### 4. ACH-028 — health EMA [baixo, corrigivel]
- arquivo: apps/worker/src/health-server.ts
- acao: manter amostra móvel dos últimos N valores de lag; readiness usa média

### 5. ACH-029 — queue depths em /health [medio, corrigivel]
- arquivo: apps/worker/src/health-server.ts
- acao: expor `{waiting,active,delayed,paused}` por fila via `Worker.getQueue()`

### 6. ACH-014 — cache TTL por tipo [baixo, corrigivel]
- arquivo: apps/api/src/lib/cache.ts
- acao: constantes `CACHE_TTL.DASHBOARD=60`, `ENTITLEMENTS=300`, `MONTHLY_STATS=3600`

### 7. ACH-007 — invalidação de cache pós-mutations [alto, corrigivel_parcial]
- arquivo: apps/api/src/lib/cache-invalidation.ts (novo)
- acao: helper `invalidateDomain(tenantId, domain)` + mapa de padrões; aplicar em 2-3 mutations principais; doc de migração

### 8. ACH-030 — Prisma slow query middleware [baixo, corrigivel]
- arquivo: packages/db/src/index.ts; packages/db/src/middleware/slow-query-middleware.ts (novo)
- acao: prisma.$use que captura queries > 500ms em prod com log warn + sample rate

### 9. ACH-005 — clients.list withTags [medio, corrigivel_parcial]
- arquivo: packages/business/clients/ports/client-repository.ts; packages/business/clients/adapters/prisma-client-repository.ts
- acao: parametro opcional `withTags` em list(); include condicional
- observacoes: uso em routers é follow-up

### 10. ACH-006 — money em decimal [medio, corrigivel_parcial]
- arquivo: packages/shared/src/money/centavos.ts (novo)
- acao: helpers `toCents(n)`/`fromCents(n)`/`addCents(a,b)`/`mulRate(c, rate)`; doc migração
- observacoes: refactor dos value-objects é follow-up

### 11. ACH-004 — campaign batch dispatch [alto, corrigivel_parcial]
- arquivo: apps/worker/src/processors/campaign-processor.ts; packages/shared/src/jobs/schemas.ts
- acao: chunks de 50 recipients via enqueueJob; sub-job `send-bulk`; messaging-processor delega
- observacoes: messaging-processor implementação completa é follow-up (já era stub)

### 12. ACH-027 — circuit breaker em adapters [medio, corrigivel_parcial]
- arquivo: packages/business/ai/adapters/deepseek-adapter.ts (se existir); doc
- acao: verificar aplicação — WhatsApp-N2 já usa; seed resend + doc

### 13. ACH-010 — BullMQ limiter [medio, corrigivel_parcial]
- arquivo: apps/worker/src/processors/messaging-processor.ts
- acao: `limiter: { max: 10, duration: 1000 }` em messaging (WhatsApp rate limit ref); doc

### 14. ACH-017 — bundle analyzer [alto, corrigivel]
- arquivo: apps/web/next.config.mjs; apps/web/package.json
- acao: `@next/bundle-analyzer`; script `analyze`; doc budget

### 15. ACH-021 — nginx brotli + gzip [medio, corrigivel]
- arquivo: deploy/nginx.conf
- acao: `gzip_comp_level 6`, `gzip_min_length 500`, comentário brotli setup

### 16. ACH-019 — ISR em páginas públicas [alto, corrigivel_parcial]
- arquivo: apps/web/src/app/(auth)/login/page.tsx (public-ish); docs
- acao: doc + aplicar `revalidate` em landing se existir; outras páginas são follow-up

### 17. ACH-020 — next/image [medio, corrigivel_parcial]
- arquivo: docs/architecture/frontend-perf.md
- acao: doc convenção; migração pontual como follow-up

### 18. ACH-018 — dynamic imports [medio, corrigivel_parcial]
- arquivo: docs/architecture/frontend-perf.md
- acao: doc com exemplos

### 19. ACH-016 — audit use client [medio, corrigivel_parcial]
- arquivo: docs/architecture/frontend-perf.md
- acao: doc + ESLint hint (seed)

### 20. ACH-023 — FlatList mobile [medio, corrigivel_parcial]
- arquivo: apps/mobile/src/screens/sales-list-screen.tsx
- acao: `windowSize`, `keyExtractor`, `renderItem` memo em 1 tela como seed; doc

### 21. ACH-001 — SLOs/SLIs doc + Prometheus alerts [alto, corrigivel_parcial]
- arquivo: docs/SLO.md (novo); deploy/prometheus-alerts.yml (novo)
- acao: doc targets por serviço; alert rules file

### 22. ACH-002 — Grafana dashboards [medio, corrigivel_parcial]
- arquivo: deploy/grafana-provisioning/dashboards/ (stubs)
- acao: 1-2 dashboards JSON seed + doc

### 23. ACH-024 — Web Vitals RUM [alto, corrigivel_parcial]
- arquivo: apps/web/src/lib/web-vitals.ts (novo); apps/web/src/app/layout.tsx
- acao: Reporter via `web-vitals` package com endpoint /api/vitals; Sentry hook
- observacoes: package install como follow-up

### 24. ACH-026 — load tests k6 [alto, corrigivel_parcial]
- arquivo: scripts/load-tests/k6-smoke.js (novo); docs/architecture/load-testing.md
- acao: script k6 básico com 2-3 fluxos; doc CI

### 25. ACH-011 — Redis Sentinel [alto, corrigivel_parcial]
- arquivo: deploy/docker-compose.sentinel.yml (novo); docs/architecture/redis-ha.md
- acao: compose exemplar + doc; adoção em produção é humana

### 26. ACH-012 — Postgres replication [alto, corrigivel_parcial]
- arquivo: docs/architecture/postgres-ha.md
- acao: doc com opções (streaming replication via pg_basebackup vs RDS Multi-AZ); runbook failover

### 27. ACH-013 — Prisma connection pool docs [medio, corrigivel]
- arquivo: .env.production.example; docs/architecture/postgres-ha.md (incluído)
- acao: documentar `?connection_limit=3` em DATABASE_URL do worker

### 28. ACH-025 — Docker Compose HA [alto, corrigivel_parcial]
- arquivo: docs/architecture/scaling-deploy.md; deploy/k8s/ (stubs)
- acao: doc "scale up short-term + K8s migration path"; manifests seed

### 29. ACH-022 — CDN via assetPrefix [alto, corrigivel_parcial]
- arquivo: apps/web/next.config.mjs; docs/architecture/scaling-deploy.md
- acao: `assetPrefix: process.env.CDN_URL` opt-in + doc

### 30. ACH-008 — superjson streaming [baixo, nao_corrigivel]
- motivo: decisão arquitetural que requer alternativa completa (gRPC streaming, chunked response, etc); não resolvível com trocas pontuais
- acao_recomendada_ao_usuario: reavaliar em roadmap se relatórios > 1MB surgirem

## Achados Não Corrigíveis
- ACH-008 — justificativa acima

## Resumo do Plano
- Total a corrigir: 10
- Total parcial: 19
- Total não corrigível: 1
- Estimativa de commits: ~16 (agrupando docs e infra relacionados)
