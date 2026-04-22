# Progresso da Correção

## Identificação
- dominio: observabilidade-operacao
- run_id: 2026-04-19_07-51-34
- branch: fix/observabilidade-operacao/2026-04-19_07-51-34
- data_inicio: 2026-04-22 00:35:00
- ultima_atualizacao: 2026-04-22 (revisor ACH-004)
- fase_atual: revisor
- status: em_andamento

## Resumo de Progresso
- total_aprovados: 15
- corrigidos_executor: 15
- revisados_revisor: 4
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
- status_revisor: pendente
- commit_executor: 2b47c85
- arquivos_alterados:
  - apps/api/src/lib/metrics.ts (prismaPoolSize, redisActiveConnections, outboxLagMs, cacheHit/Miss)

### ACH-006
- titulo: Alertas Prometheus sem Alertmanager
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: b1686aa
- arquivos_alterados:
  - deploy/alertmanager.yml (novo)
  - deploy/prometheus.yml (alerting block)
  - docker-compose.prod.yml (service alertmanager + volume)

### ACH-007
- titulo: Sem SLIs/SLOs formais
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 9f22319
- arquivos_alterados:
  - docs/SLO.md (SLIs, mapping Prometheus, cadence expandida)

### ACH-008
- titulo: Grafana sem datasources/dashboards provisionados
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 1f0d440
- arquivos_alterados:
  - deploy/grafana/provisioning/datasources/prometheus.yml (novo)
  - deploy/grafana/provisioning/dashboards/dashboards.yml (novo)
  - deploy/grafana/dashboards/wbc-overview.json (novo)
  - docker-compose.prod.yml (volumes)

### ACH-009
- titulo: Fluxos críticos sem spans manuais
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: ade1b8b
- arquivos_alterados:
  - packages/shared/src/observability/with-span.ts (novo)
  - packages/shared/src/index.ts
  - packages/business/sales/use-cases/create-sale.ts (piloto)

### ACH-010
- titulo: Health checks inconsistentes
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: c415094
- arquivos_alterados:
  - docs/HEALTH.md (novo — contrato unificado + gaps identificados)

### ACH-011
- titulo: requestId não propaga para outbox events
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: ae65ce9
- arquivos_alterados:
  - packages/shared/src/events/event-publisher.ts (metadata com traceparent)

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
