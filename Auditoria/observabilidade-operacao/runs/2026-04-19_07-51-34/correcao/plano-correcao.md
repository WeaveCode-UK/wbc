# Plano de Correção

## Identificação
- dominio: observabilidade-operacao
- run_id: 2026-04-19_07-51-34
- data_geracao: 2026-04-22 00:35:00
- total_achados: 15
- corrigiveis: 2
- corrigiveis_parciais: 13
- nao_corrigiveis: 0

## Ordem de Execução (por dependência/proximidade)

### 1. ACH-003 — PII redact em logs (alto, corrigivel)
Arquivo: packages/shared/src/logger.ts + security-logger.ts; redactor Pino com paths para *.email/*.phone/*.password/*.token + helpers maskPhone/maskEmail (redactPhone já existe).

### 2. ACH-013 — Log level warn em prod (baixo, corrigivel)
Arquivo: packages/shared/src/logger.ts (ou apps/api/src/lib/logger.ts); LOG_LEVEL env default warn em prod, info em dev.

### 3. ACH-012 — Sentry beforeSend + sample rate (medio, corrigivel)
Arquivo: apps/api/src/lib/sentry.ts e apps/worker/src/index.ts; beforeSend redactor + unificar SENTRY_TRACES_SAMPLE_RATE.

### 4. ACH-001 — Endpoints /metrics (alto, corrigivel_parcial)
Arquivo: apps/worker/src/health-server.ts (adicionar /metrics); apps/api já expõe (/api/metrics via web). Documentar.

### 5. ACH-005 — Métricas infra (alto, corrigivel_parcial)
Criar stubs em apps/api/src/lib/metrics.ts: wbc_prisma_pool_size, wbc_bullmq_queue_depth, wbc_outbox_lag_ms; helper que lê periodicamente.

### 6. ACH-002 — traceId em logs/Sentry (alto, corrigivel_parcial)
Helper em packages/shared que integra Pino com OTel context (AsyncLocalStorage). Piloto no logger principal.

### 7. ACH-011 — requestId propagation (medio, corrigivel_parcial)
event-publisher aceita metadata; event-subscriber expõe. Piloto: outbox payload carrega parentRequestId.

### 8. ACH-004 — DLQ métrica + alerta (alto, corrigivel_parcial)
Métrica wbc_dlq_events_total{queue} já implementada no dlq-processor (verificar). Adicionar regra em deploy/alerts.yml.

### 9. ACH-006 — Alertmanager (alto, corrigivel_parcial)
Adicionar serviço alertmanager em docker-compose.prod.yml + deploy/alertmanager.yml template (Slack webhook placeholder).

### 10. ACH-007 — SLO doc upgrade (alto, corrigivel_parcial)
docs/SLO.md já existe; expandir com error budget, availability por serviço e regras Prometheus derivadas.

### 11. ACH-008 — Grafana provisioning (medio, corrigivel_parcial)
deploy/grafana/provisioning/datasources.yml + dashboards/ (JSON skeleton).

### 12. ACH-009 — Spans manuais piloto (medio, corrigivel_parcial)
Helper `withSpan(name, attrs, fn)` em shared; piloto em use-case createSale.

### 13. ACH-010 — Health checks unificados (medio, corrigivel_parcial)
docs/HEALTH.md + helper padrão. Auditar paridade entre apps/api, web, worker.

### 14. ACH-015 — Runbooks por alerta (medio, corrigivel_parcial)
Template docs/runbooks/_template.md; gerar esqueletos para os alertas existentes em alerts.yml.

### 15. ACH-014 — Nginx JSON logs (baixo, corrigivel_parcial)
deploy/nginx.conf adicionar log_format json_combined.

## Resumo
- 2 corrigiveis + 13 corrigiveis_parciais = 15
- Parciais documentam follow-up em docs/OBSERVABILITY-FOLLOWUP.md
- Estimativa de commits: ~15 + init + transição + fixes type-check + relatório
