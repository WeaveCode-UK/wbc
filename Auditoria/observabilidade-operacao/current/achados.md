# Achados da Auditoria

## Identificacao
- dominio: observabilidade-operacao
- run_id: 2026-04-05_18-00-00
- ultima_atualizacao: 2026-04-05 18:30:00

## Severidades Permitidas
- critico, alto, medio, baixo, informativo

## Status Permitidos
- aberto, confirmado, mitigado, resolvido, aceito, nao_aplicavel

## Achados Registrados

### ACH-OO-001
- titulo: Metricas Prometheus com 4 custom metrics
- severidade: informativo
- categoria: metricas
- status: confirmado
- resumo: O metrics.ts define 4 metricas custom: wbc_trpc_request_duration_seconds (Histogram), wbc_trpc_requests_total (Counter), wbc_domain_errors_total (Counter), wbc_active_connections_total (Counter). Tambem coleta metricas default via collectDefaultMetrics.

#### Evidencia
- arquivo_ou_area: apps/api/src/lib/metrics.ts
- detalhe: Histogram com buckets [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]. Labels: path, type, status. Registry dedicado.

#### Impacto
- tecnico: Metricas essenciais para monitoramento de latencia e throughput.
- negocio: Visibilidade operacional.

#### Recomendacao
- acao_sugerida: Nenhuma.
- prioridade: nenhuma

---

### ACH-OO-002
- titulo: OpenTelemetry tracing configurado com auto-instrumentations
- severidade: informativo
- categoria: tracing
- status: confirmado
- resumo: O tracing.ts inicializa NodeSDK com OTLPTraceExporter e auto-instrumentations. Desabilita fs instrumentation para reduzir ruido. Condicional: so ativa se OTEL_EXPORTER_OTLP_ENDPOINT estiver definido.

#### Evidencia
- arquivo_ou_area: apps/api/src/lib/tracing.ts
- detalhe: serviceName: 'wbc-api'. Exporter: OTLP HTTP. Auto-instrumentations excluindo fs.

#### Impacto
- tecnico: Distributed tracing disponivel quando endpoint configurado.
- negocio: Debug de performance em producao.

#### Recomendacao
- acao_sugerida: Nenhuma.
- prioridade: nenhuma

---

### ACH-OO-003
- titulo: Structured logging com Pino em todos os servicos
- severidade: informativo
- categoria: logging
- status: confirmado
- resumo: Logger factory (createLogger) cria instancias Pino com nome do servico, nivel info em producao e debug em dev. Pino-pretty ativo em dev. Usado em health, cache, worker e middleware.

#### Evidencia
- arquivo_ou_area: apps/api/src/lib/logger.ts, apps/worker/src/lib/logger.ts
- detalhe: `pino({ name: 'wbc-${service}', level: production ? 'info' : 'debug' })`.

#### Impacto
- tecnico: Logs estruturados (JSON) em producao, legivel em dev.
- negocio: nenhum impacto direto.

#### Recomendacao
- acao_sugerida: Nenhuma.
- prioridade: nenhuma

---

### ACH-OO-004
- titulo: RequestId propagado no logging middleware
- severidade: informativo
- categoria: rastreabilidade
- status: confirmado
- resumo: O logging middleware em trpc.ts inclui requestId, userId e tenantId em cada log de request. O requestId e gerado no context via randomUUID().

#### Evidencia
- arquivo_ou_area: apps/api/src/trpc/trpc.ts:33-49, apps/api/src/trpc/context.ts:10
- detalhe: `apiLogger.info({ requestId: ctx.requestId, userId: ctx.tenant?.userId, tenantId: ctx.tenant?.tenantId, path, type, durationMs })`

#### Impacto
- tecnico: Correlacao de logs por request.
- negocio: Debug eficiente.

#### Recomendacao
- acao_sugerida: Nenhuma.
- prioridade: nenhuma

---

### ACH-OO-005
- titulo: Sentry configurado com sample rate de 30% em producao
- severidade: informativo
- categoria: error-tracking
- status: confirmado
- resumo: Sentry inicializado com tracesSampleRate 0.3 em producao e 1.0 em dev. Graceful: se SENTRY_DSN nao definido, Sentry nao e ativado.

#### Evidencia
- arquivo_ou_area: apps/api/src/lib/sentry.ts
- detalhe: `Sentry.init({ dsn, environment, tracesSampleRate: production ? 0.3 : 1.0 })`

#### Impacto
- tecnico: Error tracking em producao com overhead reduzido.
- negocio: Visibilidade de erros.

#### Recomendacao
- acao_sugerida: Nenhuma.
- prioridade: nenhuma

---

### ACH-OO-006
- titulo: HTTP health check endpoint com status degraded
- severidade: informativo
- categoria: health-checks
- status: confirmado
- resumo: O /api/health (Next.js route) verifica DB e retorna status healthy ou degraded com HTTP 200 ou 503. Inclui apiVersion e timestamp.

#### Evidencia
- arquivo_ou_area: apps/web/src/app/api/health/route.ts
- detalhe: Checks DB via SELECT 1. Retorna `{ status, apiVersion, checks, timestamp }` com 503 se degraded.

#### Impacto
- tecnico: Load balancers e monitoring podem usar este endpoint.
- negocio: nenhum impacto direto.

#### Recomendacao
- acao_sugerida: Nenhuma.
- prioridade: nenhuma

---

### ACH-OO-007
- titulo: Prometheus + Grafana configurados no Docker Compose
- severidade: informativo
- categoria: monitoramento
- status: confirmado
- resumo: docker-compose.prod.yml inclui Prometheus (com 30d retention), alerts.yml e Grafana com subpath /grafana/. Stack completa de monitoramento.

#### Evidencia
- arquivo_ou_area: docker-compose.prod.yml:109-137, deploy/prometheus.yml, deploy/alerts.yml
- detalhe: Prometheus com config e alerts montados como volumes. Grafana com datasource Prometheus. Retencao de 30 dias.

#### Impacto
- tecnico: Stack de observabilidade completa.
- negocio: Visibilidade operacional.

#### Recomendacao
- acao_sugerida: Nenhuma.
- prioridade: nenhuma

---

### ACH-OO-008
- titulo: Logging middleware nao registra status de erro
- severidade: baixo
- categoria: logging
- status: confirmado
- resumo: O logging middleware em trpc.ts sempre registra status 'ok' na metrica httpRequestDuration e httpRequestTotal, independentemente de a request ter falhado. O result.ok nao e verificado.

#### Evidencia
- arquivo_ou_area: apps/api/src/trpc/trpc.ts:33-49
- detalhe: `httpRequestDuration.observe({ path, type, status: 'ok' }, durationSec)` — sempre 'ok', nunca 'error'.

#### Impacto
- tecnico: Metricas de erro nao sao coletadas. Dashboard Grafana nao mostra error rate real.
- negocio: Falsa sensacao de que nao ha erros.

#### Recomendacao
- acao_sugerida: Verificar result.ok e usar status 'error' quando falso. Considerar wrapping em try/catch para capturar erros do middleware.
- prioridade: media
