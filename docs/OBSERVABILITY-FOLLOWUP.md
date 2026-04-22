# Observability Follow-up (audit `observabilidade-operacao` run 2026-04-19_07-51-34)

Itens semeados pela correção automatizada que requerem continuidade humana.

## ACH-001 — /metrics API/Worker

**Entregue:** worker expõe /metrics na porta 9100; prometheus.yml lista job `wbc-api` e `wbc-worker`.
**Falta:** rota `/api/metrics` dedicada em apps/api (hoje depende do web); instrumentar histogramas por procedure tRPC com buckets adequados ao SLO.

## ACH-002 — traceId em logs/Sentry

**Entregue:** `primeTraceContext()` carrega OTel API; `getActiveTraceContext()` expõe traceId/spanId; Pino mixin injeta em cada log quando há span.
**Falta:** wire em web (apps/web) e worker (apps/worker) — hoje só API chama `primeTraceContext()`. Configurar Sentry `sentry-otel` (pacote oficial) para herdar spans automaticamente.

## ACH-005 — Métricas de infra

**Entregue:** gauges `wbc_prisma_pool_size`, `wbc_redis_active_connections`, `wbc_outbox_lag_ms`, `wbc_cache_hits_total`, `wbc_cache_misses_total` em apps/api/src/lib/metrics.ts.
**Falta:** alimentar os gauges — hoje estão em zero. Criar Prisma middleware que lê pool size periodicamente; hook no ioredis para conexões ativas; cache helpers chamar `cacheHitTotal.inc()`.

## ACH-006 — Alertmanager

**Entregue:** `deploy/alertmanager.yml` template + serviço no docker-compose + config em prometheus.yml.
**Falta:** preencher `SLACK_WEBHOOK_URL` e `PAGERDUTY_ROUTING_KEY` em `.env.production`. Testar end-to-end (disparar alerta de teste).

## ACH-007 — SLOs

**Entregue:** `docs/SLO.md` expandido com SLIs, mapping Prometheus, cadência de review.
**Falta:** recording rules em `deploy/alerts.yml` para pré-calcular SLIs. Dashboard "SLO Overview" em Grafana (placeholder em ACH-008).

## ACH-008 — Grafana

**Entregue:** provisioning declarativo (datasources.yml + dashboards.yml) + dashboard "WBC Overview" mínimo.
**Falta:** dashboards por domínio (auth, sales, messaging); SLO Overview; RUM (Web Vitals) panel.

## ACH-009 — Spans manuais

**Entregue:** helper `withSpan` + piloto em `sales.createSale`.
**Falta:** aplicar em outros use-cases críticos (confirmSale, cancelSale, createCampaign, sendMessage, dispatch de handler).

## ACH-010 — Health checks

**Entregue:** `docs/HEALTH.md` documentando contrato.
**Falta:** adicionar Redis PING em `apps/web/src/app/api/health/route.ts`; adicionar queue depth failure threshold em worker.

## ACH-011 — requestId/traceparent no outbox

**Entregue:** event-publisher anexa metadata com `traceparent` quando há span ativo.
**Falta:** DomainEvent type declarar `metadata?` formalmente; worker ler metadata e propagar via OTel context quando for processar.

## ACH-013 — Log level

**Entregue:** LOG_LEVEL env + centralização em @wbc/shared.
**Falta:** se Pino emite muito info em produção com warn default, auditar logger.info calls em handlers (outbox-processor, campaign-processor).

## ACH-014 — Nginx logs JSON

**Entregue:** log_format json_combined; volume nginx_logs.
**Falta:** pipeline que consome o volume (Filebeat/Promtail config); nginx-prometheus-exporter opcional para métricas de borda.

## ACH-015 — Runbooks

**Entregue:** `docs/runbooks/_template.md` + runbooks para DLQ, outbox-lag, queue-depth, target-down.
**Falta:** runbook para HighErrorRate, SlowRequests, HighRequestRate (alertas legados); link `runbook_url` já adicionado em alerts.yml deve apontar para paths reais após merge em main.
