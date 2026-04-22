# Progresso da Correção

## Identificação
- dominio: observabilidade-operacao
- run_id: 2026-04-19_07-51-34
- branch: fix/observabilidade-operacao/2026-04-19_07-51-34
- data_inicio: 2026-04-22 00:35:00
- ultima_atualizacao: 2026-04-22 (revisor ACH-011)
- fase_atual: revisor
- status: em_andamento

## Resumo de Progresso
- total_aprovados: 15
- corrigidos_executor: 15
- revisados_revisor: 10
- corrigidos_pelo_revisor: 1
- nao_corrigiveis: 0
- nao_aprovados: 0
- pendentes: 0

## Achados

### ACH-001
- titulo: Prometheus coleta apenas web:3000 — API e Worker sem /metrics expostos
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: corrigido_pelo_revisor
- commit_executor: e676b91
- arquivos_alterados:
  - apps/worker/src/lib/metrics.ts (novo)
  - apps/worker/src/health-server.ts (rota /metrics)
  - deploy/prometheus.yml (jobs wbc-api e wbc-worker)
- resultado_revisao: |
    Worker OK — workerMetricsRegistry com collectDefaultMetrics +
    wbc_outbox_lag_ms, wbc_bullmq_queue_depth, wbc_dlq_events_total,
    servido em :9100/metrics pelo health-server. Prometheus.yml com 3
    jobs (web, api, worker) OK. DISCREPÂNCIA: job `wbc-api` aponta
    para `api:3001/api/metrics`, mas apps/api era módulo sem HTTP
    server — scrape quebrado e metricsRegistry tRPC inacessível.
    Revisor adicionou apps/api/src/metrics-server.ts (servidor
    node:http mínimo em 3001 expondo metricsRegistry) e wiring em
    apps/api/src/index.ts. Type-check pnpm --filter @wbc/api passou.

### ACH-002
- titulo: OpenTelemetry e Sentry desacoplados — traceId não flui para logs/errors
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado_direto
- commit_executor: ea46c70
- arquivos_alterados:
  - packages/shared/src/observability/trace-context.ts (novo)
  - packages/shared/src/logger.ts (Pino mixin)
  - packages/shared/src/index.ts
  - apps/api/src/lib/tracing.ts (primeTraceContext)
- resultado_revisao: |
    trace-context.ts expõe getActiveTraceContext() + primeTraceContext()
    com dynamic import opcional de @opentelemetry/api (refinado em
    c9f3c8b para usar string literal moduleName e evitar bundler
    resolvendo em compile-time). Pino mixin em logger.ts chama
    getActiveTraceContext() por log e injeta traceId/spanId só quando
    há span — zero alocação quando OTel desligado. apps/api
    tracing.ts chama primeTraceContext() logo após sdk.start(). Sem
    @opentelemetry/api em packages/shared/package.json (confirmado).
    Filtro traceId all-zeros (00000…) previne logs com span sintético.
    Sentry-OTel integration documentado como follow-up em
    docs/OBSERVABILITY-FOLLOWUP.md — parcial aceitável conforme
    classificacao original.

### ACH-003
- titulo: Logs contêm PII sem redação
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado_direto
- commit_executor: dc9f5c8
- arquivos_alterados:
  - packages/shared/src/logger.ts (Pino redact paths + censor)
- nota_revisor: >
    Diff dc9f5c8 adiciona `redact: { paths: REDACT_PATHS, censor: "[REDACTED]" }`
    em createLogger. REDACT_PATHS cobre recomendação (`*.email`, `*.phone`,
    `*.password`, `*.token`) e amplia com `passwordHash`, `accessToken`,
    `refreshToken`, `apiKey`, `authorization`, `*.headers.authorization`,
    `*.headers.cookie` e versões top-level. Censor é literal `[REDACTED]`.
    security-logger.ts já usa `redactSecurityFields` (import linha 1, aplicado
    em phone/userId/tenantId/email/jti) — cobertura complementar OK.

### ACH-004
- titulo: DLQ sem dashboard, alerta ou retry automático
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado_direto
- commit_executor: 509ede6
- arquivos_alterados:
  - deploy/alerts.yml (DLQEventsGrowing + outros)
  - apps/worker/src/processors/dlq-processor.ts (dlqEventsTotal.inc)
- nota_revisor: >
    Diff 509ede6 adiciona `dlqEventsTotal.inc({ queue: job.data.originalQueue })`
    em processDLQJob (importado de apps/worker/src/lib/metrics.ts, Counter
    `wbc_dlq_events_total` com label `queue` definido no ACH-001). alerts.yml
    ganha DLQEventsGrowing (`increase(wbc_dlq_events_total[5m]) > 10`, for 2m,
    warning + runbook), OutboxLagHigh (`wbc_outbox_lag_ms > 60000`, for 3m),
    BullMQQueueDepthHigh (`wbc_bullmq_queue_depth{state="waiting"} > 1000`,
    for 5m) e runbook_url adicionado em TargetDown. Métrica é
    `wbc_dlq_events_total` (Counter de eventos novos) em vez do
    `wbc_dlq_depth` (Gauge) sugerido — aceitável como parcial, pois
    increase() em 5m captura exatamente o "crescimento da DLQ" que a
    recomendação pede para alertar. Retry exponencial (3 attempts +
    backoff) já vem do ACH-003 confiabilidade em defaultJobOptions;
    painel Grafana DLQ Events já presente em wbc-overview.json (ACH-008).

### ACH-005
- titulo: Sem métricas de infra
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado_direto
- commit_executor: 2b47c85
- arquivos_alterados:
  - apps/api/src/lib/metrics.ts (prismaPoolSize, redisActiveConnections, outboxLagMs, cacheHit/Miss)
- nota_revisor: >
    Diff 2b47c85 adiciona cinco métricas ao metricsRegistry do API:
    Gauge `wbc_prisma_pool_size`, Gauge `wbc_redis_active_connections`,
    Gauge `wbc_outbox_lag_ms` (espelho do worker), Counter
    `wbc_cache_hits_total{store}` e Counter `wbc_cache_misses_total{store}`.
    Comentário inline indica origem (ACH-005) e aponta para follow-up.
    Worker já expõe `wbc_bullmq_queue_depth{queue,state}` + `wbc_outbox_lag_ms`
    em apps/worker/src/lib/metrics.ts (entregues no ACH-001). Classificação
    parcial correta: os gauges de API ficam em zero até Prisma middleware +
    ioredis hook + cache helpers chamarem .set()/.inc() — follow-up humano
    documentado em docs/OBSERVABILITY-FOLLOWUP.md §ACH-005.

### ACH-006
- titulo: Alertas Prometheus sem Alertmanager
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado_direto
- commit_executor: b1686aa
- arquivos_alterados:
  - deploy/alertmanager.yml (novo)
  - deploy/prometheus.yml (alerting block)
  - docker-compose.prod.yml (service alertmanager + volume)
- nota_revisor: >
    Diff b1686aa confere: alertmanager.yml com route raiz + subroutes
    `severity=critical → pagerduty-critical` (continue:true) e
    `severity=warning → slack-default`; receivers `slack-default`
    (slack_configs em #wbc-alerts com template renderizando runbook_url
    por alerta) e `pagerduty-critical` (pagerduty_configs com
    ${PAGERDUTY_ROUTING_KEY}); inhibit_rules suprimindo warning quando
    critical ativo. prometheus.yml ganha bloco `alerting.alertmanagers`
    apontando `alertmanager:9093` static_config. docker-compose.prod.yml
    adiciona serviço `alertmanager` (prom/alertmanager:latest) com
    env_file .env.production, volume montando alertmanager.yml ro +
    alertmanager_data em /alertmanager, depends_on:prometheus,
    cap_drop:[ALL] e no-new-privileges; volume declarado no bloco
    volumes. deploy/alerts.yml tem `runbook_url` em 4 alertas (ACH-004/
    ACH-015). Parcial correta: SLACK_WEBHOOK_URL + PAGERDUTY_ROUTING_KEY
    ficam como env vars humanas no .env.production (follow-up
    documentado em docs/OBSERVABILITY-FOLLOWUP.md).

### ACH-007
- titulo: Sem SLIs/SLOs formais
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado_direto
- commit_executor: 9f22319
- arquivos_alterados:
  - docs/SLO.md (SLIs, mapping Prometheus, cadence expandida)
- nota_revisor: >
    Diff 9f22319 estende docs/SLO.md (que já tinha Targets + Error budget
    desde ACH-001 perf) com quatro blocos: (1) entrada em History datada
    2026-04-22; (2) tabela "SLIs & Prometheus mapping" com fórmula
    PromQL por SLI — availability (`1 - rate(5xx)/rate(total)`), p95
    tRPC query e mutation (`histogram_quantile(0.95, rate(wbc_trpc_request_duration_seconds_bucket{type=...}[5m]))`),
    outbox lag (`wbc_outbox_lag_ms`), DLQ depth (`wbc_bullmq_queue_depth{queue=~".*dlq.*"}`),
    worker readiness (`avg_over_time(up{job="wbc-worker"}[5m])`),
    prisma pool, redis memory, web vitals via histogram — todas
    consistentes com métricas entregues em ACH-001/004/005; (3) Review
    cadence expandida com trilha semanal/mensal/trimestral substituindo
    o "Monthly" genérico original; (4) Service-level reporting apontando
    dashboard Grafana "SLO Overview" (ACH-008). Parcial aceitável: recording
    rules Prometheus propriamente ditas ainda não estão em alerts.yml —
    documento descreve o esperado mas a transcrição para `record:` rules
    fica como follow-up em docs/OBSERVABILITY-FOLLOWUP.md (consistente
    com a classificação original de corrigivel_parcial).

### ACH-008
- titulo: Grafana sem datasources/dashboards provisionados
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado_direto
- commit_executor: 1f0d440
- arquivos_alterados:
  - deploy/grafana/provisioning/datasources/prometheus.yml (novo)
  - deploy/grafana/provisioning/dashboards/dashboards.yml (novo)
  - deploy/grafana/dashboards/wbc-overview.json (novo)
  - docker-compose.prod.yml (volumes)
- nota_revisor: >
    Diff 1f0d440 confere: datasources/prometheus.yml com Prometheus
    (type=prometheus, url=http://prometheus:9090, isDefault:true,
    editable:false, timeInterval 15s, httpMethod POST) — aponta para o
    service name correto no compose network. dashboards/dashboards.yml
    com provider file `wbc` em folder `WBC`, path
    `/var/lib/grafana/dashboards`, updateIntervalSeconds 30,
    allowUiUpdates:true. wbc-overview.json com os 6 painéis recomendados:
    (1) tRPC Request Rate — `sum by (type) (rate(wbc_trpc_requests_total[1m]))`;
    (2) tRPC p95 Latency — `histogram_quantile(0.95, rate(wbc_trpc_request_duration_seconds_bucket[5m]))`
    by type; (3) Outbox Lag — `wbc_outbox_lag_ms`; (4) BullMQ Queue Depth
    — `wbc_bullmq_queue_depth` by queue+state; (5) Domain Errors —
    `rate(wbc_domain_errors_total[5m])` by error_class; (6) DLQ Events —
    `rate(wbc_dlq_events_total[5m])` by queue. PromQL consistente com
    métricas entregues em ACH-001/004/005. docker-compose.prod.yml monta
    `./deploy/grafana/provisioning:/etc/grafana/provisioning:ro` e
    `./deploy/grafana/dashboards:/var/lib/grafana/dashboards:ro`
    adicionais ao `grafana_data:/var/lib/grafana` já existente. Parcial
    aceitável: dashboards por domínio (auth, sales, messaging), SLO
    Overview (referenciado no docs/SLO.md do ACH-007) e RUM ainda
    pendentes como follow-up humano em
    docs/OBSERVABILITY-FOLLOWUP.md §ACH-008.

### ACH-009
- titulo: Fluxos críticos sem spans manuais
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado_direto
- commit_executor: ade1b8b
- commit_post_fix: c9f3c8b (ajuste OTel dynamic import)
- arquivos_alterados:
  - packages/shared/src/observability/with-span.ts (novo)
  - packages/shared/src/index.ts
  - packages/business/sales/use-cases/create-sale.ts (piloto)
- nota_revisor: >
    Helper withSpan correto — OtelApi/OtelSpan como types locais (evita
    dep de @opentelemetry/api no shared), dynamic import via
    moduleName var com `/* @vite-ignore */` (compat com bundlers),
    cache de null quando OTel ausente (fallback silencioso). Piloto
    em sales.createSale usa atributos padronizados wbc.tenantId,
    wbc.clientId, wbc.items.count; SpanStatusCode.OK/ERROR aplicado
    via api.SpanStatusCode, recordException no catch, span.end() em
    finally. Parcial aceitável: piloto em 1 use-case — expansão
    (confirm-sale, campanha, messaging) fica como follow-up humano
    em docs/OBSERVABILITY-FOLLOWUP.md §ACH-009 (já documentado pelo
    executor). Type-check do @wbc/shared passou sem erros após o
    post-fix c9f3c8b.

### ACH-010
- titulo: Health checks inconsistentes
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado_direto
- commit_executor: c415094
- arquivos_alterados:
  - docs/HEALTH.md (novo — contrato unificado + gaps identificados)
- nota_revisor: >
    Diff c415094 entrega docs/HEALTH.md com os 4 blocos requeridos:
    (1) definição dos 3 níveis — `live` (sempre 200 se event loop
    responde), `ready` (só 200 com dependências OK) e `startup`
    (k8s, 503 durante warm-up de composition root + migrations);
    (2) contrato por serviço — api (rotas /health/live, /health/ready,
    /health com Postgres SELECT 1 + Redis PING + outbox lag;
    referencia apps/api/src/routers/health.ts como OK), web (rota
    /api/health com Postgres; gap explícito "adicionar Redis PING"
    apontado para OBSERVABILITY-FOLLOWUP) e worker (porta 9100 com
    outbox lag EMA + BullMQ não pausados + gap "queue depth só
    reporta, não falha"); (3) regras gerais — live nunca toca banco,
    timeout por dependência, estrutura JSON {status, checks,
    timestamp}, códigos 200/503/500; (4) thresholds — outbox 60s
    worker / 30s middleware, queue depth warn 1000 / fail 5000,
    com ponteiro para docs/SLO.md. Gaps não implementados
    (web+Redis, worker+queue depth fail) são exatamente o que a
    classificação parcial admite e estão registrados em
    docs/OBSERVABILITY-FOLLOWUP.md como follow-up humano.

### ACH-011
- titulo: requestId não propaga para outbox events
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado_direto
- commit_executor: ae65ce9
- arquivos_alterados:
  - packages/shared/src/events/event-publisher.ts (metadata com traceparent)
- nota_revisor: >
    Diff ae65ce9 importa getActiveTraceContext de ../observability/trace-context
    (mesmo helper do ACH-002) e, dentro de publish(), coleta traceCtx antes de
    montar o DomainEvent. Quando há span ativo, injeta `metadata: { traceId,
    spanId, traceparent }` no evento, com traceparent no formato W3C
    `00-<traceId>-<spanId>-01` (flags=sampled). Sem span ativo, metadata fica
    undefined e o spread condicional `...(metadata ? { metadata } : {})` omite
    o campo — evento segue exatamente igual ao anterior, preservando
    compatibilidade com consumidores antigos. Tipo ampliado via intersection
    `DomainEvent<T> & { metadata?: unknown }` em vez de mutar a interface
    domain-event.ts, mantendo o contrato base estável. Parcial aceitável: o
    worker (outbox-dispatcher / BullMQ processor) ainda não lê `metadata` para
    criar span de continuação via OTel propagator — follow-up documentado em
    docs/OBSERVABILITY-FOLLOWUP.md §ACH-011. Jobs BullMQ sem propagação de
    traceparent ficam no mesmo follow-up.

### ACH-012
- titulo: Sentry sem beforeSend e sampling desbalanceado
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: fe14a1f
- arquivos_alterados:
  - apps/worker/src/index.ts (beforeSend + sample unificado)
  - apps/api/src/lib/sentry.ts (sample unificado)

### ACH-013
- titulo: Log level info em produção amplifica volume
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 4b77b3f
- arquivos_alterados:
  - apps/api/src/lib/logger.ts (delega para @wbc/shared)
  - apps/worker/src/lib/logger.ts (delega para @wbc/shared)

### ACH-014
- titulo: Nginx sem access/error log estruturado
- severidade: baixo
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 0685007
- arquivos_alterados:
  - deploy/nginx.conf (log_format json_combined)
  - docker-compose.prod.yml (volume nginx_logs)

### ACH-015
- titulo: Sem runbooks por alerta
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 6cb3a15
- arquivos_alterados:
  - docs/runbooks/_template.md (novo)
  - docs/runbooks/dlq-growing.md (novo)
  - docs/runbooks/outbox-lag.md (novo)
  - docs/runbooks/queue-depth.md (novo)
  - docs/runbooks/target-down.md (novo)
