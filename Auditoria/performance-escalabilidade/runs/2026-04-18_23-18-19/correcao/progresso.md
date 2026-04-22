# Progresso da Correção

## Identificação
- dominio: performance-escalabilidade
- run_id: 2026-04-18_23-18-19
- branch: fix/performance-escalabilidade/2026-04-18_23-18-19
- data_inicio: 2026-04-22 00:10:00
- ultima_atualizacao: 2026-04-22 01:45:00
- fase_atual: revisor
- status: em_andamento

## Resumo de Progresso
- total_aprovados: 30
- corrigidos_executor: 29
- revisados_revisor: 0
- corrigidos_pelo_revisor: 0
- nao_corrigiveis: 1
- nao_aprovados: 0
- pendentes: 0

## Mapa commit_executor por achado

### Batch 1 — 813006d (ACH-003/009/013/014)
- ACH-003: tracing fail-fast em prod + warn estruturado em dev
- ACH-009: outbox polling com reentrance guard (isOutboxPolling flag)
- ACH-013: Prisma connection_limit docs em .env.production.example
- ACH-014: CACHE_TTL diferenciado por tipo (DASHBOARD/MONTHLY_STATS/...)

### Batch 2 — c2a23c8 (ACH-028/029)
- ACH-028: lag EMA (6 samples) no health-server; readiness decide pela média
- ACH-029: queue depths (waiting/active/delayed/failed) via Queue.getJobCounts

### Batch 3 — 7860679 (ACH-030)
- ACH-030: slow query middleware em @wbc/db; wired em API + worker com threshold 500ms

### Batch 4 — 3a32eb7 (ACH-005/007)
- ACH-005: withTags flag em ClientRepository.list (evita N+1 quando UI precisa)
- ACH-007: cache-invalidation helper com domain→patterns; seed em clients.create

### Batch 5 — 88e8e1b (ACH-006)
- ACH-006: centavos.ts com toCents/fromCents/mulQuantity/applyRateBps em bigint

### Batch 6 — 91827e1 (ACH-004/010)
- ACH-004: campaign-processor com chunks de 50 recipients + send-bulk via Promise.all
- ACH-010: messaging worker com limiter {max:10, duration:1000} (Meta WhatsApp tier)

### Batch 7 — 05cb7d6 (ACH-017/021/022)
- ACH-017: @next/bundle-analyzer opt-in via ANALYZE=1 + script analyze
- ACH-021: nginx gzip_comp_level 6 + min_length 500 + brotli comentado (opt-in)
- ACH-022: assetPrefix via CDN_URL em next.config

### Batch 8 — 8bf9429 (ACH-024)
- ACH-024: web-vitals.ts (lazy import) + /api/vitals beacon endpoint

### Batch 9 — f810517 (ACH-001/002/011/012/016/018/019/020/023/025/026/027)
- ACH-001: docs/SLO.md + deploy/prometheus-alerts.yml
- ACH-002: deploy/grafana-provisioning/dashboards/
- ACH-011: docs/architecture/redis-ha.md + deploy/docker-compose.sentinel.yml
- ACH-012: docs/architecture/postgres-ha.md
- ACH-016+018+019+020: docs/architecture/frontend-perf.md (4 seções)
- ACH-023: docs/architecture/mobile-perf.md
- ACH-025: docs/architecture/scaling-deploy.md + deploy/k8s/
- ACH-026: scripts/load-tests/k6-smoke.js + docs/architecture/load-testing.md
- ACH-027: docs/architecture/circuit-breaker.md

### ACH-015 — ja_resolvido_por_outra_run
- resolvido em apis-integracoes/ACH-018 (page.max(MAX_PAGE=1000))

### ACH-008 — nao_corrigivel
- motivo: streaming/chunked response é decisão arquitetural; reavaliar quando relatórios > 1MB surgirem

## Achados

### ACH-001
- titulo: SLOs/SLIs não documentados
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: f810517

### ACH-002
- titulo: Grafana sem dashboards
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: f810517

### ACH-003
- titulo: initTracing silencioso
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 813006d

### ACH-004
- titulo: Campaign processor sequencial
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 91827e1

### ACH-005
- titulo: N+1 em clients.list
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 3a32eb7

### ACH-006
- titulo: Totais em number
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 88e8e1b

### ACH-007
- titulo: Cache invalidation ausente
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 3a32eb7

### ACH-008
- titulo: Superjson sem streaming
- severidade: baixo
- classificacao: nao_corrigivel
- status_executor: nao_aplicavel
- status_revisor: nao_aplicavel
- commit_executor: none
- observacoes: decisão arquitetural; reavaliar em roadmap

### ACH-009
- titulo: Outbox sem reentrância
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 813006d

### ACH-010
- titulo: BullMQ sem limiter
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 91827e1

### ACH-011
- titulo: Redis single-node
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: f810517

### ACH-012
- titulo: Postgres sem replication
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: f810517

### ACH-013
- titulo: Prisma pool connection_limit
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 813006d

### ACH-014
- titulo: Cache TTL uniforme
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 813006d

### ACH-015
- titulo: Paginação page sem cap
- severidade: medio
- classificacao: corrigivel
- status_executor: ja_resolvido_por_outra_run
- status_revisor: nao_aplicavel
- commit_executor: resolvido em apis-integracoes/ACH-018

### ACH-016
- titulo: 23 arquivos use client
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: f810517

### ACH-017
- titulo: Sem bundle analyzer
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 05cb7d6

### ACH-018
- titulo: Sem dynamic imports
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: f810517

### ACH-019
- titulo: Sem ISR/SSG
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: f810517

### ACH-020
- titulo: next/image não usado
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: f810517

### ACH-021
- titulo: nginx sem brotli/gzip tuning
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 05cb7d6

### ACH-022
- titulo: Sem CDN
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 05cb7d6

### ACH-023
- titulo: FlatList não otimizada
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: f810517

### ACH-024
- titulo: Sem Web Vitals RUM
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 8bf9429

### ACH-025
- titulo: Compose replicas 1
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: f810517

### ACH-026
- titulo: Sem load tests
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: f810517

### ACH-027
- titulo: Circuit breaker não aplicado
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: f810517

### ACH-028
- titulo: Health sem média móvel
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: c2a23c8

### ACH-029
- titulo: Health sem queueDepths
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: c2a23c8

### ACH-030
- titulo: Prisma slow queries
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 7860679
