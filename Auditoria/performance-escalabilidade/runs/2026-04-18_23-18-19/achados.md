# Achados da Auditoria

## Identificação
- dominio: performance-escalabilidade
- run_id: 2026-04-18_23-18-19
- ultima_atualizacao: 2026-04-18 23:40:00

## Severidades Permitidas
- critico · alto · medio · baixo · informativo

## Status Permitidos
- aberto · confirmado · mitigado · resolvido · aceito · nao_aplicavel

## Achados Registrados

### ACH-001
- titulo: SLOs/SLIs não documentados; alertas Prometheus ausentes
- severidade: alto
- categoria: sinais-e-observabilidade-de-performance
- status: confirmado
- resumo: `docs/adr/007-resilience-strategies.md` propõe SLOs (outbox lag ≤30s, uptime ≥99.5%) mas marca como "pendente validação humana". Não há `docs/SLO.md` executivo; Prometheus scrapes métricas básicas mas não há regras de alerta.

#### Evidencia
- arquivo_ou_area: docs/adr/007-resilience-strategies.md:67-77; deploy/prometheus.yml (scrape sem alerting rules)
- detalhe: Sem baseline para decidir quando escalar

#### Impacto
- tecnico: Degradação só é detectada por reclamação do usuário
- negocio: Incidentes longos sem resposta

#### Recomendacao
- acao_sugerida: Publicar `docs/SLO.md` com targets por serviço; configurar alert rules (`outbox_lag_ms > 60s`, `prisma_pool_usage > 80%`, `trpc_latency_p95 > 800ms`)
- prioridade: alta

---

### ACH-002
- titulo: Grafana sem dashboards provisionados
- severidade: medio
- categoria: sinais-e-observabilidade-de-performance
- status: confirmado
- resumo: `deploy/prometheus.yml` coleta métricas, mas não há `deploy/grafana-provisioning/dashboards/` com painéis declarativos (latência p95, queue depth, lag, pool utilization).

#### Evidencia
- arquivo_ou_area: deploy/prometheus.yml; ausência de deploy/grafana-provisioning/

#### Impacto
- tecnico: Observabilidade manual/errática em incidente
- negocio: MTTR alto

#### Recomendacao
- acao_sugerida: Commitar JSON de dashboards (latência tRPC por procedure; BullMQ queue depth; outbox lag; Prisma pool; memória/CPU)
- prioridade: media

---

### ACH-003
- titulo: `initTracing()` silencioso se `OTEL_EXPORTER_OTLP_ENDPOINT` ausente
- severidade: medio
- categoria: observabilidade
- status: confirmado
- resumo: `apps/api/src/lib/tracing.ts` retorna silenciosamente quando a env var não está setada. Em produção sem essa config, zero traces são exportados.

#### Evidencia
- arquivo_ou_area: apps/api/src/lib/tracing.ts:8

#### Impacto
- tecnico: Falha silenciosa oculta ausência de traces em produção
- negocio: Debug lento em incidente

#### Recomendacao
- acao_sugerida: Em produção, exigir a env var (falha rápida); em dev emitir warning; log estruturado com status "tracing_enabled"
- prioridade: media

---

### ACH-004
- titulo: Campaign processor envia a recipients em loop sequencial sem batching
- severidade: alto
- categoria: throughput-de-workers
- status: confirmado
- resumo: `apps/worker/src/processors/campaign-processor.ts` itera `for (const recipient of recipients)` sem enfileirar em lote nem executar em paralelo. Processa em O(n) sequencial e ainda parece incompleto (só loga). Escalabilidade da messaging fica sabotada.

#### Evidencia
- arquivo_ou_area: apps/worker/src/processors/campaign-processor.ts:18-32; packages/business/campaigns/adapters/prisma-campaign-repository.ts

#### Impacto
- tecnico: Latência linear com N destinatários; oportunidade de batch perdida
- negocio: Campanhas pequenas demoram; grandes ficam inviáveis

#### Recomendacao
- acao_sugerida: Emitir evento único "campaign.dispatch" com array de recipientIds, dividir em sub-jobs `send-bulk` em `Promise.all([queue.add(...)])`; messaging-processor processa lotes atómicos com idempotency-key
- prioridade: alta

---

### ACH-005
- titulo: N+1 potencial em `clients.list` quando consumidor exige tags
- severidade: medio
- categoria: acesso-a-dados
- status: confirmado
- resumo: `PrismaClientRepository.list()` retorna `Client[]` sem `include: { tags: true }`. Quando a UI quer tags por cliente, o callback acaba fazendo 1+N queries.

#### Evidencia
- arquivo_ou_area: packages/business/clients/adapters/prisma-client-repository.ts:31

#### Impacto
- tecnico: 21 queries em vez de 1 com join; contention DB sob N tenants
- negocio: Tela de CRM fica lenta com muitos clientes

#### Recomendacao
- acao_sugerida: Flag opcional `withTags` em `list()` que aciona `include`; teste unitário do repo com snapshot da quantidade de queries
- prioridade: media

---

### ACH-006
- titulo: Cálculo de totais de venda em `number` (IEEE 754) em vez de Decimal
- severidade: medio
- categoria: correctness-e-performance
- status: confirmado
- resumo: `computeItemSubtotal`/`computeSaleTotal` em `packages/business/sales/domain/value-objects.ts` operam em `number`. Precisão binária acumula arredondamentos em centavos.

#### Evidencia
- arquivo_ou_area: packages/business/sales/domain/value-objects.ts:29-50
- detalhe: `0.1 + 0.2 !== 0.3` em JS; `Math.max(0, ...)` encobre perdas

#### Impacto
- tecnico: Drift entre valor calculado e armazenado (Decimal)
- negocio: Divergência em faturas e reconciliação

#### Recomendacao
- acao_sugerida: Usar `decimal.js` ou `bigint` (centavos) em todas as operações monetárias; converter na fronteira
- prioridade: media

---

### ACH-007
- titulo: Ausência de invalidação sistemática de cache após mutations
- severidade: alto
- categoria: cache
- status: confirmado
- resumo: `apps/api/src/lib/cache.ts` provê `cacheInvalidatePatternForTenant()`, mas apenas entitlements o invoca (no evento planChanged). Sales/clients/campaigns não invalidam cache após mutations → dados stale até TTL expirar.

#### Evidencia
- arquivo_ou_area: apps/api/src/lib/cache.ts:65-77; apps/api/src/lib/entitlements.ts:43

#### Impacto
- tecnico: Usuário vê estado antigo após editar; suporte recebe reclamações
- negocio: Confusão e retrabalho

#### Recomendacao
- acao_sugerida: Hook em mutations: após `create/update/delete` chamar `cacheInvalidatePatternForTenant('sales:*')`, etc.; lista central com padrões por domínio
- prioridade: alta

---

### ACH-008
- titulo: Superjson em toda resposta sem limite de tamanho ou streaming
- severidade: baixo
- categoria: serializacao
- status: confirmado
- resumo: Todas as respostas tRPC passam por `superjson.serialize`, inclusive datasets grandes (dashboards analíticos). Sem corte de payload ou streaming; serialização completa antes do envio.

#### Evidencia
- arquivo_ou_area: apps/api/src/trpc/trpc.ts:19

#### Impacto
- tecnico: 10-50ms em payloads médios; pior em relatórios
- negocio: UX percebida pobre em relatórios grandes

#### Recomendacao
- acao_sugerida: Paginação cursor-based em listas grandes; considerar streaming para relatórios (chunked response)
- prioridade: baixa

---

### ACH-009
- titulo: Outbox processor em polling de 5s sem controle de concorrência/ backpressure
- severidade: alto
- categoria: filas-e-controle-de-carga
- status: confirmado
- resumo: `apps/worker/src/index.ts` usa `setInterval(processOutbox, 5000)` sem flag para evitar reentrada. Quando processamento fica lento, rodadas sobrepõem, aumentam lag e podem disparar readiness failure (cascata de restarts).

#### Evidencia
- arquivo_ou_area: apps/worker/src/index.ts:68-76; apps/worker/src/health-server.ts (threshold 60s)

#### Impacto
- tecnico: Lag crescente sob carga; restarts cascateados
- negocio: Instabilidade sob pico

#### Recomendacao
- acao_sugerida: Flag `isProcessing` para evitar reentrância; interval adaptativo (10s se lag > 30s); usar média móvel em `/health/ready`
- prioridade: alta

---

### ACH-010
- titulo: Workers BullMQ com concurrency hardcoded e sem limitador adaptativo
- severidade: medio
- categoria: filas-e-controle-de-carga
- status: confirmado
- resumo: messaging=5, campaign=2, schedule=3, analytics=1 — fixos no código, sem `limiter` por provedor externo (WhatsApp/Resend). Em burst, filas não priorizadas congestionam provider externo.

#### Evidencia
- arquivo_ou_area: apps/worker/src/processors/*.ts

#### Impacto
- tecnico: Subutilização de recursos ou sobrecarga do provider externo
- negocio: Rate-limit de API externa = erro cascata

#### Recomendacao
- acao_sugerida: `JobsOptions.priority`; `limiter: { max, duration }` por provider; documentar escala horizontal em função de `queueDepth`
- prioridade: media

---

### ACH-011
- titulo: Redis single-node é SPOF — sem Sentinel/Cluster
- severidade: alto
- categoria: escalabilidade
- status: confirmado
- resumo: `docker-compose.prod.yml` declara `redis:7-alpine` como instância única. Outbox depende dele para BullMQ; cache API também. Queda = perda de jobs in-flight + cache total miss.

#### Evidencia
- arquivo_ou_area: docker-compose.prod.yml:22-35; apps/api/src/lib/redis.ts; apps/worker/src/lib/redis.ts

#### Impacto
- tecnico: Indisponibilidade total em falha de Redis
- negocio: Downtime direto

#### Recomendacao
- acao_sugerida: Redis Sentinel (3 nodes) ou Cluster; ou ElastiCache gerenciado com failover automático; elevar `maxmemory` conforme uso
- prioridade: alta

---

### ACH-012
- titulo: Postgres single-node sem replication streaming
- severidade: alto
- categoria: escalabilidade
- status: confirmado
- resumo: `docker-compose.prod.yml` roda `postgres:16-alpine` como container único; `docs/DEPLOYMENT.md` marca replicação como pendente. Sem read replicas, sem failover.

#### Evidencia
- arquivo_ou_area: docker-compose.prod.yml:3-19; docs/DEPLOYMENT.md
- detalhe: Backup script existe mas sem drill (ver dados-persistencia/ACH-018)

#### Impacto
- tecnico: Falha de storage = perda; DR não validado
- negocio: Continuidade comprometida

#### Recomendacao
- acao_sugerida: Primary + hot standby via `pg_basebackup`; ou RDS Multi-AZ; runbook de failover documentado
- prioridade: alta

---

### ACH-013
- titulo: Prisma connection pool fixo sem revisão para escala horizontal
- severidade: medio
- categoria: escalabilidade
- status: confirmado
- resumo: ADR-008 menciona `connection_limit=5` no worker, mas sem aplicação explícita no DATABASE_URL. Com 5 workers em produção (plano de escala), 5×5 + 20 (API) ≈ 45 conexões — próximo do limite padrão.

#### Evidencia
- arquivo_ou_area: docs/adr/008-worker-scaling.md:54-59; .env.production.example (sem connection_limit documentado)

#### Impacto
- tecnico: Pool exhaust em pico → timeouts
- negocio: Erros intermitentes na UI

#### Recomendacao
- acao_sugerida: Documentar `?connection_limit=3` no DATABASE_URL do worker; planilha de capacidade (`1 worker = 3`, `1 web = 20`, total ≤ 70)
- prioridade: media

---

### ACH-014
- titulo: Cache TTL uniforme (300s) sem diferenciação por tipo de dado
- severidade: baixo
- categoria: cache
- status: confirmado
- resumo: `CACHE_TTL.MEDIUM = 300s` é usado para dashboard (muda sempre) e stats mensais (estáveis). TTL único reduz hit-rate para dados estáveis e produz stale para dinâmicos.

#### Evidencia
- arquivo_ou_area: apps/api/src/lib/cache.ts:137-142

#### Impacto
- tecnico: Miss rate elevado desnecessário
- negocio: Dashboard lento fora do cache; stats antigas quando TTL expira

#### Recomendacao
- acao_sugerida: Constantes diferenciadas: DASHBOARD=60s, ENTITLEMENTS=300s, MONTHLY_STATS=3600s
- prioridade: baixa

---

### ACH-015
- titulo: Paginação aceita `limit` até 100 e `page` irrestrito (cross-ref apis-integracoes/ACH-018)
- severidade: medio
- categoria: protecao-operacional
- status: confirmado
- resumo: `paginationSchema` limita `limit ≤ 100`, mas `page` não tem cap. `skip = (page-1)*limit` gera OFFSET gigante → query degradada.

#### Evidencia
- arquivo_ou_area: packages/validators/src/common.ts:3-6; packages/shared/src/prisma-helpers.ts:23-27

#### Impacto
- tecnico: DoS via OFFSET em tabelas grandes
- negocio: Degradação em carga maliciosa

#### Recomendacao
- acao_sugerida: Limitar `page ≤ 1000` no schema; cursor-based para grandes listas
- prioridade: media

---

### ACH-016
- titulo: Árvore client extensa — 23 arquivos `use client` na web
- severidade: medio
- categoria: frontend
- status: confirmado
- resumo: Providers (Session/Theme/ErrorBoundary) e páginas do dashboard são Client Components. TTI cresce por hidratação ampla.

#### Evidencia
- arquivo_ou_area: apps/web/src/app/** (23 hits de "use client"); layout.tsx usa providers client

#### Impacto
- tecnico: Bundle JS inicial maior; hidratação pesada
- negocio: UX lenta em 3G/4G

#### Recomendacao
- acao_sugerida: Providers como Server Components quando possível; manter client apenas em forms/interativos; auditar `"use client"` com ESLint rule
- prioridade: media

---

### ACH-017
- titulo: Ausência de bundle analyzer e de orçamento de bundle no CI
- severidade: alto
- categoria: frontend
- status: confirmado
- resumo: `apps/web/package.json` não inclui `@next/bundle-analyzer`. Não há gate que falhe PRs quando bundle cresce além de um teto.

#### Evidencia
- arquivo_ou_area: apps/web/package.json; next.config.mjs (sem `withBundleAnalyzer`)

#### Impacto
- tecnico: Regressão silenciosa de bundle
- negocio: UX degrada sem aviso

#### Recomendacao
- acao_sugerida: Adicionar `@next/bundle-analyzer`; script `analyze`; CI falha se chunk principal > 250KB gzip
- prioridade: alta

---

### ACH-018
- titulo: Sem dynamic imports — páginas carregam todos os componentes pesados
- severidade: medio
- categoria: frontend
- status: confirmado
- resumo: Zero uso de `dynamic(() => import(...))`. Modais e editores pesados fazem parte do bundle principal.

#### Evidencia
- arquivo_ou_area: apps/web/src/**/*.tsx (zero hits de `dynamic(`)

#### Impacto
- tecnico: Code-splitting ausente
- negocio: TTI alto em rotas leves

#### Recomendacao
- acao_sugerida: Identificar >50KB (modais, editores, gráficos) e envolver em `dynamic()` com `ssr: false`
- prioridade: media

---

### ACH-019
- titulo: Ausência de `revalidate` (ISR) e SSG em rotas públicas
- severidade: alto
- categoria: frontend-e-escalabilidade
- status: confirmado
- resumo: Nenhuma rota usa `revalidate` ou `generateStaticParams`. Landing, catálogo público e páginas marketing fazem SSR a cada request.

#### Evidencia
- arquivo_ou_area: apps/web/src/app/**/*.tsx (zero hits)

#### Impacto
- tecnico: Carga desnecessária no server; cache do Next.js não usado
- negocio: Latência p95 alta em picos

#### Recomendacao
- acao_sugerida: `revalidate: 3600` em landing e `/catalog/public/[slug]`; webhook para revalidar sob demanda (publish do catálogo)
- prioridade: alta

---

### ACH-020
- titulo: `next/image` não é usado — assets sem otimização de formato/lazy
- severidade: medio
- categoria: frontend
- status: confirmado
- resumo: Zero `<Image>` em `apps/web/src/**`. Avatares e banners servem sem webp/avif, sem lazy load nem responsive srcset.

#### Evidencia
- arquivo_ou_area: apps/web/src/**/*.tsx (sem Next Image)

#### Impacto
- tecnico: Payload maior; LCP pior em mobile
- negocio: UX em redes lentas

#### Recomendacao
- acao_sugerida: Envolver avatares e banners em `<Image>` com `sizes` responsivo; placeholder `blur`
- prioridade: media

---

### ACH-021
- titulo: nginx sem brotli e com `gzip_min_length=1000` não-ótimo
- severidade: medio
- categoria: rede-e-entrega
- status: confirmado
- resumo: `deploy/nginx.conf` ativa gzip mas sem brotli; nenhum `gzip_comp_level` definido. `gzip_min_length 1000` deixa bundles pequenos sem compressão.

#### Evidencia
- arquivo_ou_area: deploy/nginx.conf:40-43

#### Impacto
- tecnico: 15-20% de bytes extras; menos economia de banda
- negocio: Latência percebida pior

#### Recomendacao
- acao_sugerida: Instalar `ngx_brotli` (ou migrar para CDN); `gzip_comp_level 6`, `gzip_min_length 500`; adicionar brotli paralelamente
- prioridade: media

---

### ACH-022
- titulo: Sem CDN — assets 100% via nginx local (SPOF geográfico)
- severidade: alto
- categoria: rede-e-entrega
- status: confirmado
- resumo: `next.config.mjs` não define `assetPrefix`. HTML e `_next/static/*` servidos por nginx único, sem edge cache.

#### Evidencia
- arquivo_ou_area: apps/web/next.config.mjs; docker-compose.prod.yml (nginx -> web local)

#### Impacto
- tecnico: Latência global; banda limitada; SPOF
- negocio: Experiência inconsistente em diferentes regiões

#### Recomendacao
- acao_sugerida: CloudFront/Cloudflare como CDN; `assetPrefix` via env; definir `Cache-Control` por tipo de resposta
- prioridade: alta

---

### ACH-023
- titulo: React Native: `FlatList` sem `windowSize`, `React.memo` ou `keyExtractor` estabilizado
- severidade: medio
- categoria: mobile
- status: confirmado
- resumo: Listas de clients/sales em `apps/mobile` não otimizam render (sem `windowSize`, `updateCellsBatchingPeriod`); `renderItem` sem `React.memo`.

#### Evidencia
- arquivo_ou_area: apps/mobile/src/screens/sales-list-screen.tsx:57-88; clients-list-screen.tsx:62-100

#### Impacto
- tecnico: Frame drops com 100+ itens reais
- negocio: UX mobile pobre em listas longas

#### Recomendacao
- acao_sugerida: `windowSize={10}`, `updateCellsBatchingPeriod={50}`, `keyExtractor` estável, `renderItem` memoizado
- prioridade: media

---

### ACH-024
- titulo: Sem Web Vitals RUM — Sentry sample muito baixo em prod
- severidade: alto
- categoria: observabilidade-de-frontend
- status: confirmado
- resumo: Nenhum pacote de coleta de `CLS/LCP/FID/INP` está ativo; `apps/web/sentry.client.config.ts` usa `tracesSampleRate: 0.3` em prod e não captura Web Vitals.

#### Evidencia
- arquivo_ou_area: apps/web/sentry.client.config.ts; ausência de `web-vitals`/`@vercel/analytics`

#### Impacto
- tecnico: Regressões de UX não detectadas
- negocio: Problemas de experiência passam despercebidos

#### Recomendacao
- acao_sugerida: Instalar `web-vitals`; reportar para Sentry ou endpoint `/api/vitals`; elevar sample a `0.1` para transactions críticas
- prioridade: alta

---

### ACH-025
- titulo: Docker Compose com `replicas: 1` — sem HA nem load balancing interno
- severidade: alto
- categoria: escalabilidade
- status: confirmado
- resumo: `docker-compose.prod.yml` roda web/worker como instâncias únicas. Sem orchestrator (K8s), escalar é manual.

#### Evidencia
- arquivo_ou_area: docker-compose.prod.yml:38-94

#### Impacto
- tecnico: SPOF; crash derruba sistema
- negocio: Downtime em qualquer falha

#### Recomendacao
- acao_sugerida: Migrar para Kubernetes (HPA + PDB); alternativa curta: `docker compose up --scale web=2` + nginx upstream atualizado
- prioridade: alta

---

### ACH-026
- titulo: Ausência de testes de carga (k6/artillery) — capacidade real desconhecida
- severidade: alto
- categoria: escalabilidade
- status: confirmado
- resumo: Nenhum script de load test no repositório. `docs/DEPLOYMENT.md` cita SLOs como pendentes. Sem baseline de p95, breaking point, saturation.

#### Evidencia
- arquivo_ou_area: ausência de `k6.js`/`artillery.yml`; docs/DEPLOYMENT.md

#### Impacto
- tecnico: Escala adivinhada
- negocio: Picos podem derrubar o sistema

#### Recomendacao
- acao_sugerida: Script k6 com fluxos críticos (login, listar clients, criar sale); rodar em staging; publicar números em ADR
- prioridade: alta

---

### ACH-027
- titulo: Circuit breaker existe mas não é aplicado em handlers de integração
- severidade: medio
- categoria: resiliencia
- status: confirmado
- resumo: `packages/shared/src/circuit-breaker.ts` está implementado mas nenhum processor (campaign, messaging, analytics) usa para isolar WhatsApp/Resend/DeepSeek.

#### Evidencia
- arquivo_ou_area: packages/shared/src/circuit-breaker.ts; apps/worker/src/processors/*.ts

#### Impacto
- tecnico: Falha externa cascateia; retries sem freio
- negocio: Duração prolongada de incidente

#### Recomendacao
- acao_sugerida: Envolver chamadas externas com circuit breaker + fallback (DLQ + alerta); métricas por provider
- prioridade: media

---

### ACH-028
- titulo: Health server expõe estado instantâneo sem média móvel (falsos negativos em GC)
- severidade: baixo
- categoria: saude-operacional
- status: confirmado
- resumo: `apps/worker/src/health-server.ts` expõe `outboxLagMs` em tempo real. GC pauses podem levar a readiness false-fail e restart em cascata.

#### Evidencia
- arquivo_ou_area: apps/worker/src/health-server.ts

#### Impacto
- tecnico: Restarts espúrios
- negocio: Instabilidade em janela de GC

#### Recomendacao
- acao_sugerida: Usar p95/ema dos últimos N; considerar isolate GC; `readiness` usa threshold de ventana, não pontual
- prioridade: baixa

---

### ACH-029
- titulo: Health server não expõe `queueDepths` para alarme de backpressure
- severidade: medio
- categoria: saude-operacional
- status: confirmado
- resumo: `collectWorkerStatus()` reporta `paused`, não tamanho das filas. Não há sinal para autoscaler/alarmar quando fila cresce.

#### Evidencia
- arquivo_ou_area: apps/worker/src/health-server.ts:43-55

#### Impacto
- tecnico: Saturação sem alarme
- negocio: Latência de processamento aumenta sem ação

#### Recomendacao
- acao_sugerida: Expor `{waiting, active, delayed, paused}` por fila; Prometheus alert `waiting > 1000`
- prioridade: media

---

### ACH-030
- titulo: Prisma não loga slow queries em produção
- severidade: baixo
- categoria: observabilidade-de-dados
- status: confirmado
- resumo: Logging `'query'` do Prisma só em `NODE_ENV === 'development'`. Sem detecção passiva de N+1/missing index em prod.

#### Evidencia
- arquivo_ou_area: packages/db/src/index.ts:7

#### Impacto
- tecnico: Queries lentas descobertas tarde
- negocio: Mau uso dos recursos do banco

#### Recomendacao
- acao_sugerida: Middleware Prisma que capture queries > 500ms em prod com amostragem; exportar métrica; cross-ref com `pg_stat_statements` (ACH-022 dados-persistencia)
- prioridade: baixa
