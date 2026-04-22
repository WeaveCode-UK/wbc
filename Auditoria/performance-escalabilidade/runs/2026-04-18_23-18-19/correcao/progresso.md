# Progresso da Correção

## Identificação
- dominio: performance-escalabilidade
- run_id: 2026-04-18_23-18-19
- branch: fix/performance-escalabilidade/2026-04-18_23-18-19
- data_inicio: 2026-04-22 00:10:00
- ultima_atualizacao: 2026-04-22 02:30:00
- fase_atual: revisor
- status: em_andamento

## Resumo de Progresso
- total_aprovados: 30
- corrigidos_executor: 29
- revisados_revisor: 30
- aprovado_direto: 28
- corrigidos_pelo_revisor: 0
- nao_aplicavel: 2
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
- status_revisor: aprovado
- commit_executor: f810517
- observacoes_revisor: docs/SLO.md com tabela de alvos (availability 99.5%, p95 800ms, outbox 30s, LCP 2500ms, INP 200ms, error budget 3.6h/mês) + deploy/prometheus-alerts.yml com 5 regras (OutboxLagHigh/TrpcLatencyP95High/PrismaPoolExhausted/DlqDepthHigh/RedisMemoryHigh) cobrindo o escopo do achado

### ACH-002
- titulo: Grafana sem dashboards
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: f810517
- observacoes_revisor: deploy/grafana-provisioning/dashboards/dashboards.yaml (provider config) + wbc-overview.json com 3 panels seed (outbox lag, DLQ depth, tRPC p95). Follow-up documentado para acrescentar painéis conforme métricas ficarem disponíveis — aceitável como stub executável

### ACH-003
- titulo: initTracing silencioso
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 813006d
- observacoes_revisor: tracing.ts: NODE_ENV === "production" → throw com mensagem clara (consistente com sentry.ts e logger.ts do mesmo diretório); dev → warn estruturado `{ tracing_enabled: false, reason }`; on-start → info `{ tracing_enabled: true, endpoint }`. Comportamento da recomendação replicado fielmente

### ACH-004
- titulo: Campaign processor sequencial
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 91827e1
- observacoes_revisor: campaign-processor.ts divide recipients em chunks de 50 e enfileira `send-bulk` na MESSAGING queue via `Promise.all` com `jobId` idempotente (`campaign:{id}:chunk:{idx}`). Envio efetivo fica no messaging-processor (hoje stub até WhatsApp N2) — batching infra entregue conforme recomendação (corrigivel_parcial)

### ACH-005
- titulo: N+1 em clients.list
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 3a32eb7
- observacoes_revisor: ClientRepository.list() recebe `options?: ListClientsOptions` com `withTags: boolean`; quando setado passa `include: { tags: { include: { tag: true } } }` para paginatedQuery e mapeia retorno para `ClientWithTags[]`. Default `withTags=false` preserva call path existente (listClients use-case não precisa de tags, recebe plain Client por variância covariante `ClientWithTags extends Client`)

### ACH-006
- titulo: Totais em number
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 88e8e1b
- observacoes_revisor: packages/shared/src/money/centavos.ts novo com toCents/fromCents/toDecimalString/addCents/subCents/mulQuantity/applyRateBps (basis points)/maxCents/minCents. toCents passa via .toFixed(2) + string path para evitar drift binário. Exporta via shared/index.ts. Não converte ainda as chamadas em sales/domain — migração incremental, fiel ao corrigivel_parcial

### ACH-007
- titulo: Cache invalidation ausente
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 3a32eb7
- observacoes_revisor: lib/cache-invalidation.ts novo com DOMAIN_PATTERNS (clients/sales/campaigns/catalog/inventory/finance) mapeando patterns alvo. `invalidateDomain()` usa `cacheInvalidatePatternForTenant` (exportado de ./cache) em Promise.all. `withCacheInvalidation()` executa fn, retorna result e dispara invalidação fire-and-forget (void .catch → não bloqueia response). Seed aplicado em clients.create; demais mutations migram incrementalmente (corrigivel_parcial documentado)

### ACH-008
- titulo: Superjson sem streaming
- severidade: baixo
- classificacao: nao_corrigivel
- status_executor: nao_aplicavel
- status_revisor: nao_aplicavel
- commit_executor: none
- observacoes: decisão arquitetural; reavaliar em roadmap
- observacoes_revisor: racional confirmado — streaming/chunked requer redesenho de cliente tRPC + servidor; decisão de arquitetura adiada até surgir caso real (>1MB/rota). Recomendação da run aceita como follow-up de roadmap

### ACH-009
- titulo: Outbox sem reentrância
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 813006d
- observacoes_revisor: flag `isOutboxPolling` no escopo de módulo. Single-threaded JS: check-then-set é atômico dentro do event loop, portanto sem race. Check antes do `try`, set dentro do try com `finally` garante reset mesmo em exception. Warn estruturado quando tick é pulado — observabilidade preservada

### ACH-010
- titulo: BullMQ sem limiter
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 91827e1
- observacoes_revisor: messaging-processor usa `limiter: { max: 10, duration: 1000 }` (tier Meta WhatsApp conservador) via env MESSAGING_RATE_MAX/MESSAGING_RATE_DURATION_MS. Sintaxe BullMQ 5 correta (limiter global por worker). Outros workers (campaign/schedule/analytics) ainda sem limiter — documentado como follow-up quando providers externos específicos entrarem em jogo

### ACH-011
- titulo: Redis single-node
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: f810517
- observacoes_revisor: docs/architecture/redis-ha.md cobre Opção A (Sentinel 3 nodes + 1 replica) e B (ElastiCache/managed); snippet ioredis Sentinel config; plano de migração em 4 passos. deploy/docker-compose.sentinel.yml com replica + 3 sentinels (YAML anchor `*sentinel`). Stub executável — requer apenas `sentinel.conf` para ligar. Conforme recomendação

### ACH-012
- titulo: Postgres sem replication
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: f810517
- observacoes_revisor: docs/architecture/postgres-ha.md cobre Opção A (streaming replication + pg_basebackup + promote manual ou Patroni) e B (RDS Multi-AZ/Cloud SQL); planilha de capacidade Prisma pool (API default ~9, worker connection_limit=3, max_connections 100 com 30 reservado); runbook de failover manual com comandos; RTO ≤15min manual / ≤1min Patroni. Satisfaz recomendação

### ACH-013
- titulo: Prisma pool connection_limit
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 813006d
- observacoes_revisor: .env.production.example documenta connection_limit por serviço (worker=3, API default ~2*vCPU+1) com planilha de capacidade (max_connections 100, reserva 30 admin/migration), exemplo de DATABASE_URL completo, pointer para docs/architecture/postgres-ha.md. Aplicação explícita do valor via env depende de cada deploy — doc no env.example entrega a fonte canônica

### ACH-014
- titulo: Cache TTL uniforme
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 813006d
- observacoes_revisor: CACHE_TTL agora tem DASHBOARD=60, MONTHLY_STATS=3600, DAILY_STATS=900, CATALOG_PUBLIC=600, ENTITLEMENTS=300 (mantido); MEDIUM=300 preservado como legacy com nota de preferência por named entry. Valores diferenciados conforme recomendação do achado

### ACH-015
- titulo: Paginação page sem cap
- severidade: medio
- classificacao: corrigivel
- status_executor: ja_resolvido_por_outra_run
- status_revisor: nao_aplicavel
- commit_executor: resolvido em apis-integracoes/ACH-018
- observacoes_revisor: verificado packages/validators/src/common.ts — paginationSchema já tem `page: z.number().int().min(1).max(MAX_PAGE=1000).default(1)` e `limit: .max(MAX_PAGE_LIMIT=100)`. MAX_EFFECTIVE_OFFSET=100_000 documentado no comentário. OFFSET gigante prevenido como recomendado

### ACH-016
- titulo: 23 arquivos use client
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: f810517
- observacoes_revisor: docs/architecture/frontend-perf.md seção "use client inventory" com regras (layouts=Server, leaf boundaries, ESLint rule follow-up). Entrega o playbook; refatoração de cada arquivo é incremental — classificação corrigivel_parcial documentada

### ACH-017
- titulo: Sem bundle analyzer
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 05cb7d6
- observacoes_revisor: next.config.mjs com `maybeWithBundleAnalyzer` async que lazy-importa `@next/bundle-analyzer` só quando ANALYZE=1|true (try/catch absorve caso pacote não instalado). Composição `withNextIntl → analyzer → withSentryConfig` via top-level await (Next.js suporta config async). Script `analyze: ANALYZE=1 next build` em package.json. Pattern funciona com withSentryConfig wrapper (config é apenas objeto)

### ACH-018
- titulo: Sem dynamic imports
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: f810517
- observacoes_revisor: frontend-perf.md seção "Code splitting" com recipe `next/dynamic` (ssr:false + Skeleton), lista de candidates (modais/editores/charts >50KB), pipe para identificar top-10 via `analyze`. Playbook entregue; aplicação concreta depende de rodar analyze na bundle atual — follow-up documentado

### ACH-019
- titulo: Sem ISR/SSG
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: f810517
- observacoes_revisor: frontend-perf.md seção "ISR and SSG" com recipe `export const revalidate = 3600`, `generateStaticParams` para /catalog/public/[slug] e webhook `revalidatePath()`. Documentação do pattern entregue; aplicação real fica para quando rotas públicas estabilizarem conteúdo — corrigivel_parcial com plano concreto

### ACH-020
- titulo: next/image não usado
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: f810517
- observacoes_revisor: frontend-perf.md seção "next/image" com recipe completo (sizes responsivo), config `images.remotePatterns` exemplificado, benefícios (webp/avif, lazy, srcset, blur). Migração documentada como single-PR — follow-up de avatares/brand-logo

### ACH-021
- titulo: nginx sem brotli/gzip tuning
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 05cb7d6
- observacoes_revisor: nginx.conf com gzip_comp_level 6, gzip_min_length 500, gzip_vary on, gzip_proxied any, gzip_types expandido (fontes, wasm, svg, rss). Brotli commentado como opt-in (requer ngx_brotli na image). Conforme recomendação — brotli fica para quando imagem base oferecer o módulo

### ACH-022
- titulo: Sem CDN
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 05cb7d6
- observacoes_revisor: next.config.mjs `assetPrefix: process.env.CDN_URL || undefined` — quando CDN_URL ausente cai em undefined (served localmente). CORS via headers() continua usando AUTH_URL (não CDN_URL), sem conflito com Access-Control-Allow-Origin. Docs/architecture/scaling-deploy.md complementa com cache rules (_next/static=immutable, HTML=s-maxage 60). Recomendação atendida

### ACH-023
- titulo: FlatList não otimizada
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: f810517
- observacoes_revisor: docs/architecture/mobile-perf.md com recipe completo (windowSize=10, initialNumToRender=15, maxToRenderPerBatch=15, updateCellsBatchingPeriod=50, removeClippedSubviews, memo do Row, keyExtractor estável, useCallback em renderItem). Migração priorizada (clients → sales → schedule). Playbook documentado — aplicação em cada screen é corrigivel_parcial assumido

### ACH-024
- titulo: Sem Web Vitals RUM
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 8bf9429
- observacoes_revisor: web-vitals.ts lazy-importa `web-vitals` package (try/catch), wireup CLS/LCP/INP/FCP/TTFB; beacon via navigator.sendBeacon com fallback fetch keepalive. Route /api/vitals com runtime='edge' — NextRequest/NextResponse/console.log disponíveis em edge runtime. Componente WebVitalsReporter exportado mas ainda não plugado em layout.tsx — follow-up documentado. Infra entregue para ACH corrigivel_parcial

### ACH-025
- titulo: Compose replicas 1
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: f810517
- observacoes_revisor: docs/architecture/scaling-deploy.md cobre near-term (docker compose --scale web=2 + nginx upstream round-robin) e medium-term (K8s com HPA CPU, KEDA queue depth, PDB minAvailable=1, CDN). deploy/k8s/README.md stub listando manifests alvo (deployment/service/hpa/pdb/secret). Conforme recomendação

### ACH-026
- titulo: Sem load tests
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: f810517
- observacoes_revisor: scripts/load-tests/k6-smoke.js executa smoke (1VU×30s) contra health + tRPC health.version + login opcional, com thresholds p95<800ms e failure<1%. docs/architecture/load-testing.md cobre soak/spike/campaign roadmap e CI workflow nightly. Conforme recomendação — k6 script + ADR documentados

### ACH-027
- titulo: Circuit breaker não aplicado
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: f810517
- observacoes_revisor: docs/architecture/circuit-breaker.md cataloga WhatsAppN2Adapter (já wrapped), DeepseekAdapter/ResendEmailSender/MercadoPago (raw, follow-up), recipe com fallback estruturado + warn log, follow-ups para métrica prometheus `circuit_state{name}` e alert >5min aberto. Playbook entregue; adoção por adapter fica como follow-up corrigivel_parcial

### ACH-028
- titulo: Health sem média móvel
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: c2a23c8
- observacoes_revisor: health-server.ts `recordLag()` com ring buffer in-process (LAG_WINDOW_SIZE=6, ~30-60s janela); readiness decide via `lagStats.mean` e reporta `outboxLagMs` (instant) + `outboxLagMeanMs` (mean) + threshold. Ring buffer é state módulo-level — resetta em restart de container (aceitável, spike efêmero). Conforme recomendação

### ACH-029
- titulo: Health sem queueDepths
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: c2a23c8
- observacoes_revisor: collectWorkerStatus reporta `{ paused, waiting, active, delayed, failed }` via `new Queue(w.name, { connection: w.opts.connection }).getJobCounts()`; lazy-import de bullmq evita cycle; `q.close()` em cada probe evita leak (nova instância a cada request /health/ready, fechada antes do return). Fallback a `{ paused }` em erro. Conforme recomendação

### ACH-030
- titulo: Prisma slow queries
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 7860679
- observacoes_revisor: packages/db/src/middleware/slow-query-middleware.ts novo com `createSlowQueryMiddleware({ thresholdMs, sampleRate, warn })` usando `performance.now()` (Node 18+ nativo, stack target ok). Exposto via @wbc/db index. API + worker wireup com env PRISMA_SLOW_QUERY_MS (default 500) e PRISMA_SLOW_QUERY_SAMPLE (default 1). Logs argsKeys (sem PII). Recomendação atendida com cross-ref pg_stat_statements em comentário
