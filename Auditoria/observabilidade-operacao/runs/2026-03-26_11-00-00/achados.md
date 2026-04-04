# Achados da Auditoria

## Identificacao
- dominio: observabilidade-operacao
- run_id: 2026-03-26_11-00-00
- ultima_atualizacao: 2026-03-26 11:15:00

## Severidades Permitidas
- critico
- alto
- medio
- baixo
- informativo

## Status Permitidos
- aberto
- confirmado
- mitigado
- resolvido
- aceito
- nao_aplicavel

## Achados Registrados

---

### ACH-001
- titulo: Ausencia total de metricas de aplicacao
- severidade: critico
- categoria: metricas
- status: confirmado
- resumo: Nao existe nenhuma biblioteca de metricas (Prometheus, StatsD, etc.) instalada. O sistema nao mede throughput, latencia, taxas de erro, uso de filas, cache hit/miss ou qualquer indicador operacional.

#### Evidencia
- arquivo_ou_area: apps/api/package.json, apps/worker/package.json
- detalhe: Nenhuma dependencia de metricas em nenhum package.json. Nenhum endpoint /metrics ou exporter. Nenhuma instrumentacao de contadores, histogramas ou gauges.

#### Impacto
- tecnico: Impossivel medir performance, identificar gargalos, detectar degradacao ou validar SLIs/SLOs
- negocio: Operacao cega — problemas so descobertos quando usuarios reclamam

#### Recomendacao
- acao_sugerida: Instalar prom-client e expor endpoint /metrics com metricas basicas: request_duration_seconds, request_total, active_connections, queue_depth, cache_hit_ratio
- prioridade: critica

---

### ACH-002
- titulo: Ausencia de tracing distribuido e correlation IDs
- severidade: alto
- categoria: traces
- status: confirmado
- resumo: Nao ha OpenTelemetry ou qualquer mecanismo de tracing. Nao existe request ID propagado entre API, Worker e servicos externos.

#### Evidencia
- arquivo_ou_area: apps/api/src/, apps/worker/src/, packages/shared/src/
- detalhe: Nenhuma dependencia @opentelemetry/*. Nenhum middleware de request ID. tRPC logging-middleware registra path e duracao mas sem ID unico. Eventos do outbox tem eventId mas sem correlacao com request original.

#### Impacto
- tecnico: Impossivel correlacionar logs entre API e Worker para o mesmo fluxo
- negocio: Tempo de resolucao de incidentes multiplicado

#### Recomendacao
- acao_sugerida: Implementar middleware de request ID no tRPC context; propagar para logs, eventos e chamadas externas; considerar OpenTelemetry
- prioridade: alta

---

### ACH-003
- titulo: Sentry inicializado mas nunca utilizado para captura de erros
- severidade: alto
- categoria: error-tracking
- status: confirmado
- resumo: Sentry.init() e chamado no startup da API, mas nenhuma chamada a captureException() ou captureMessage() existe no codigo. Erros acontecem mas nao sao reportados.

#### Evidencia
- arquivo_ou_area: apps/api/src/lib/sentry.ts, apps/api/src/routers/*.ts
- detalhe: Sentry.init() presente. Nenhum captureException() em routers, use-cases ou handlers. Erros logados via pino ou lancados como TRPCError sem captura no Sentry.

#### Impacto
- tecnico: Sentry existe mas nao captura nenhum erro real
- negocio: Falsa sensacao de error tracking; problemas passam despercebidos

#### Recomendacao
- acao_sugerida: Adicionar Sentry.captureException() no error handler global do tRPC; integrar com worker
- prioridade: alta

---

### ACH-004
- titulo: Worker sem integracao com Sentry
- severidade: alto
- categoria: error-tracking
- status: confirmado
- resumo: O worker nao possui nenhuma integracao com Sentry. Erros no processamento de eventos sao logados via pino mas nunca reportados.

#### Evidencia
- arquivo_ou_area: apps/worker/src/index.ts, apps/worker/src/lib/
- detalhe: Nenhum import de @sentry/node. Nenhuma inicializacao. Erros no outbox-processor capturados por try/catch e logados, sem Sentry.

#### Impacto
- tecnico: Falhas criticas no processamento de eventos nao geram alertas
- negocio: Eventos de negocio podem falhar silenciosamente

#### Recomendacao
- acao_sugerida: Inicializar Sentry no worker; adicionar captureException() no catch do outbox-processor
- prioridade: alta

---

### ACH-005
- titulo: Ausencia de handlers para unhandledRejection e uncaughtException
- severidade: alto
- categoria: error-tracking
- status: confirmado
- resumo: Nenhum processo registra handlers para process.on('unhandledRejection') ou process.on('uncaughtException'). Erros nao capturados podem derrubar o processo silenciosamente.

#### Evidencia
- arquivo_ou_area: apps/api/src/index.ts, apps/worker/src/index.ts
- detalhe: Nenhuma chamada a process.on('unhandledRejection') ou process.on('uncaughtException') em nenhum entrypoint.

#### Impacto
- tecnico: Promise rejections nao tratadas; uncaught exceptions derrubam o processo sem log
- negocio: Crashes sem diagnostico

#### Recomendacao
- acao_sugerida: Adicionar handlers globais que loguem e reportem ao Sentry; implementar graceful shutdown
- prioridade: alta

---

### ACH-006
- titulo: Ausencia de monitoramento e alerting
- severidade: alto
- categoria: monitoramento
- status: confirmado
- resumo: Nao existe configuracao de dashboards, regras de alerta, ou mecanismo de notificacao para problemas operacionais.

#### Evidencia
- arquivo_ou_area: raiz do repositorio
- detalhe: Nenhum arquivo de configuracao de dashboard (Grafana, Datadog), alert rules, ou integracao com plataformas de monitoramento.

#### Impacto
- tecnico: Problemas nao detectados automaticamente
- negocio: Tempo de deteccao de incidentes potencialmente de horas ou dias

#### Recomendacao
- acao_sugerida: Configurar dashboards basicos e alertas criticos (error rate, queue depth, health check); depende de ACH-001 (metricas)
- prioridade: alta

---

### ACH-007
- titulo: Health checks apenas via tRPC — sem endpoints HTTP padrao
- severidade: medio
- categoria: health-checks
- status: confirmado
- resumo: Health checks existem como procedures tRPC mas nao ha endpoints HTTP padrao (/health, /healthz, /ready, /live) acessiveis por load balancers ou orchestrators.

#### Evidencia
- arquivo_ou_area: apps/api/src/routers/health.ts
- detalhe: healthRouter expoe redis e db como publicProcedure. Acessiveis apenas via protocolo tRPC. Nenhuma rota HTTP direta.

#### Impacto
- tecnico: Load balancers e Kubernetes probes nao conseguem verificar saude via HTTP padrao
- negocio: Deploy sem validacao automatica de saude

#### Recomendacao
- acao_sugerida: Criar endpoint HTTP GET /health que agrega Redis e DB; diferenciar /live de /ready
- prioridade: media

---

### ACH-008
- titulo: Web app usa console.error ao inves de logger estruturado
- severidade: medio
- categoria: logs
- status: confirmado
- resumo: O web app usa console.error em rotas de API e error boundary sem logger estruturado. @sentry/nextjs esta como dependencia mas nao esta configurado.

#### Evidencia
- arquivo_ou_area: apps/web/src/app/api/register/route.ts, apps/web/src/components/error-boundary.tsx
- detalhe: console.error('Register error:', error) e console.error('ErrorBoundary caught:', error). Sem pino, sem campos estruturados, sem Sentry.

#### Impacto
- tecnico: Erros do web app nao capturados em logs estruturados; dificil filtrar ou correlacionar
- negocio: Problemas no frontend/SSR passam despercebidos

#### Recomendacao
- acao_sugerida: Configurar @sentry/nextjs (ja instalado); usar logger consistente no web app
- prioridade: media

---

### ACH-009
- titulo: Logging sem request ID e user ID no contexto
- severidade: medio
- categoria: logs
- status: confirmado
- resumo: O tRPC logging-middleware inclui tenantId, path e duracao, mas nao inclui requestId nem userId.

#### Evidencia
- arquivo_ou_area: apps/api/src/trpc/logging-middleware.ts
- detalhe: RequestLogData tem path, type, tenantId, durationMs, ok. Sem requestId nem userId.

#### Impacto
- tecnico: Multiplos logs do mesmo request nao podem ser agrupados; impossivel rastrear acoes de usuario especifico
- negocio: Troubleshooting de problemas especificos requer correlacao manual

#### Recomendacao
- acao_sugerida: Gerar requestId (uuid) no tRPC context e propagar para todos os logs; incluir userId
- prioridade: media

---

### ACH-010
- titulo: Eventos do outbox sem logging de sucesso
- severidade: baixo
- categoria: logs
- status: confirmado
- resumo: O outbox-processor loga apenas falhas. Eventos processados com sucesso nao geram log. Impossivel verificar que eventos estao sendo processados.

#### Evidencia
- arquivo_ou_area: apps/worker/src/processors/outbox-processor.ts
- detalhe: O catch loga logger.error() mas o caminho de sucesso (markProcessed) nao gera log.

#### Impacto
- tecnico: Sem visibilidade sobre processamento normal; impossivel detectar se outbox parou
- negocio: Eventos podem parar de ser processados sem ninguem perceber

#### Recomendacao
- acao_sugerida: Adicionar log de nivel info para eventos processados; considerar log agregado periodico
- prioridade: baixa

---

### ACH-011
- titulo: SENTRY_DSN ausente do .env.example
- severidade: baixo
- categoria: configuracao
- status: confirmado
- resumo: A variavel SENTRY_DSN nao esta listada no .env.example.

#### Evidencia
- arquivo_ou_area: .env.example
- detalhe: .env.example lista outras variaveis mas nao SENTRY_DSN.

#### Impacto
- tecnico: Sentry pode ficar desabilitado em producao por falta de configuracao
- negocio: Impacto baixo — facil de corrigir

#### Recomendacao
- acao_sugerida: Adicionar SENTRY_DSN ao .env.example
- prioridade: baixa
