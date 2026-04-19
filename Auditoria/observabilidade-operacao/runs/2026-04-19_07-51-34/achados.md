# Achados da Auditoria

## Identificação
- dominio: observabilidade-operacao
- run_id: 2026-04-19_07-51-34
- ultima_atualizacao: 2026-04-19 08:15:00

## Severidades / Status
- critico · alto · medio · baixo · informativo
- aberto · confirmado · mitigado · resolvido · aceito · nao_aplicavel

## Achados Registrados

### ACH-001
- titulo: Prometheus coleta apenas `web:3000` — API e Worker sem `/metrics` expostos
- severidade: alto
- categoria: metricas
- status: confirmado
- resumo: `deploy/prometheus.yml` tem apenas um scrape para a web. `apps/api/src/lib/metrics.ts` declara métricas mas não há rota `/metrics` servindo-as; o worker também não expõe. Resultado: zero observabilidade real sobre backend e processamento assíncrono.

#### Evidencia
- arquivo_ou_area: deploy/prometheus.yml; apps/api/src/lib/metrics.ts; apps/worker/src/* (sem `/metrics`)

#### Impacto
- tecnico: Alertas baseados em métricas são cegos para backend e worker
- negocio: Incidentes no core passam despercebidos

#### Recomendacao
- acao_sugerida: Adicionar endpoint `/metrics` em apps/api (porta dedicada) e em apps/worker; criar jobs Prometheus correspondentes; expor histogramas por procedure tRPC, depth de filas, lag de outbox, hit rate de cache, connection pool
- prioridade: alta

---

### ACH-002
- titulo: OpenTelemetry e Sentry desacoplados — `traceId` não flui para logs/errors
- severidade: alto
- categoria: correlacao
- status: confirmado
- resumo: `apps/api/src/lib/tracing.ts` faz auto-instrumentação, mas não injeta `traceId`/`spanId` no logger Pino e nem no contexto do Sentry. Logs emitem `requestId` próprio; Sentry não tem baggage. Correlação entre traces, logs e erros não funciona.

#### Evidencia
- arquivo_ou_area: apps/api/src/lib/{tracing,sentry}.ts; apps/api/src/trpc/trpc.ts; packages/shared logger

#### Impacto
- tecnico: Investigação de incidente exige triagem manual entre sistemas
- negocio: MTTR alto

#### Recomendacao
- acao_sugerida: Propagar `traceId`/`spanId` para Pino via AsyncLocalStorage; configurar Sentry com `sentry-otel` para herdar spans; `traceparent`/`tracestate` propagation entre serviços
- prioridade: alta

---

### ACH-003
- titulo: Logs contêm PII sem redação (phone, userId, email)
- severidade: alto
- categoria: logs-e-pii
- status: confirmado
- resumo: `packages/shared/src/security-logger.ts` serializa `phone`, `userId` e `tenantId`. `apps/api/src/trpc/logging-middleware.ts` loga `tenantId`/`userId`/path. `apps/web/src/lib/auth.config.ts` loga email em falhas de login (cross-ref seguranca/ACH-019 e ACH-020).

#### Evidencia
- arquivo_ou_area: packages/shared/src/security-logger.ts; apps/api/src/trpc/logging-middleware.ts; apps/web/src/lib/auth.config.ts

#### Impacto
- tecnico: Retenção de PII em logs (Docker, Prometheus exemplars, Sentry)
- negocio: Risco LGPD

#### Recomendacao
- acao_sugerida: Redactor Pino com `redact: { paths: ['*.email','*.phone','*.password','*.token'] }`; helper `maskPhone`/`maskEmail`; aplicar também em security-logger e adapters
- prioridade: alta

---

### ACH-004
- titulo: DLQ sem dashboard, alerta ou retry automático (reflexo em operação)
- severidade: alto
- categoria: alerting-e-toil
- status: confirmado
- resumo: `apps/worker/src/processors/dlq-processor.ts` apenas loga. Sem métrica `dlq_depth`, sem alerta, sem retry exponencial. Toil manual para replay (cross-ref confiabilidade/ACH-006 e apis-integracoes/ACH-020).

#### Evidencia
- arquivo_ou_area: apps/worker/src/processors/dlq-processor.ts

#### Impacto
- tecnico: Falhas acumulam sem ação
- negocio: Mensagens e eventos críticos perdidos

#### Recomendacao
- acao_sugerida: Métrica `wbc_dlq_depth{queue}`; alerta `> 10`; retry com backoff exponencial (3 tentativas) antes do DLQ; painel Grafana
- prioridade: alta

---

### ACH-005
- titulo: Sem métricas de infra (Prisma pool, Redis, BullMQ queue depth)
- severidade: alto
- categoria: metricas
- status: confirmado
- resumo: `apps/api/src/lib/metrics.ts` registra apenas métricas de tRPC e erros de domínio. Falta `wbc_prisma_pool_size`, `wbc_redis_active_connections`, `wbc_bullmq_queue_depth{queue}`, `wbc_outbox_lag_ms`.

#### Evidencia
- arquivo_ou_area: apps/api/src/lib/metrics.ts; apps/worker/src/health-server.ts

#### Impacto
- tecnico: Detecção de saturação tardia
- negocio: Incidente chega ao usuário antes do alarme

#### Recomendacao
- acao_sugerida: Instrumentar `ioredis` (hooks), Prisma middleware, BullMQ `Queue.getJobCounts` em tarefa periódica; expor via `/metrics`
- prioridade: alta

---

### ACH-006
- titulo: Alertas Prometheus genéricos e sem Alertmanager / canais (Slack/PagerDuty)
- severidade: alto
- categoria: alerting-e-toil
- status: confirmado
- resumo: `deploy/alerts.yml` define regras simples (HighErrorRate, SlowRequests, HighRequestRate) mas não há `alertmanager` no compose nem webhook/Slack/PagerDuty. Ninguém é notificado.

#### Evidencia
- arquivo_ou_area: deploy/alerts.yml; docker-compose.prod.yml (sem alertmanager); ausência de integrações

#### Impacto
- tecnico: Alertas disparam no vazio
- negocio: Incidentes dependem de percepção humana

#### Recomendacao
- acao_sugerida: Adicionar `alertmanager` ao compose com routes para Slack webhook; PagerDuty para criticos; runbook link em cada alerta
- prioridade: alta

---

### ACH-007
- titulo: Sem SLIs/SLOs formais; alertas não são vinculados a contratos de SLA
- severidade: alto
- categoria: slos
- status: confirmado
- resumo: Projeto carece de `docs/SLO.md` declarando latência-alvo, error budget, availability. Alertas são thresholds soltos. Cross-ref performance/ACH-001.

#### Evidencia
- arquivo_ou_area: ausência de docs/SLO.md; alerts.yml sem referência a SLA

#### Impacto
- tecnico: Priorização reativa
- negocio: Expectativa de qualidade não contratualizada

#### Recomendacao
- acao_sugerida: Publicar SLO (latency p95, error rate, availability por serviço); regras derivadas em Prometheus; dashboard de error budget
- prioridade: alta

---

### ACH-008
- titulo: Grafana sem datasources/dashboards provisionados
- severidade: medio
- categoria: dashboards
- status: confirmado
- resumo: Compose inclui container Grafana, mas sem `deploy/grafana/provisioning/` com datasources e JSON de dashboards. Mesmo problema já visto em performance/ACH-002; aqui reiterado pelo ângulo de operação.

#### Evidencia
- arquivo_ou_area: docker-compose.prod.yml; ausência de deploy/grafana/provisioning

#### Impacto
- tecnico: Onboarding e operação manuais
- negocio: MTTR alto

#### Recomendacao
- acao_sugerida: Provisioning declarativo (datasources.yml + dashboards/*.json cobrindo tRPC, workers, Redis, Postgres, outbox)
- prioridade: alta

---

### ACH-009
- titulo: Fluxos críticos (create/confirm sale, campanha, messaging) sem spans manuais
- severidade: medio
- categoria: traces
- status: confirmado
- resumo: Apenas auto-instrumentação (http/db). Sem `tracer.startActiveSpan('createSale', ...)` em use-cases nem em handlers do worker. Diagnóstico de latência de domínio fica cego.

#### Evidencia
- arquivo_ou_area: apps/api/src/routers/sales.ts; apps/worker/src/processors/*.ts

#### Impacto
- tecnico: Traces cobrem borda, não domínio
- negocio: Gargalos internos invisíveis

#### Recomendacao
- acao_sugerida: Spans por use-case; atributos padronizados (`tenantId`, `entity.id`, `action`); regras para sampling seletivo
- prioridade: media

---

### ACH-010
- titulo: Health checks inconsistentes entre `api`, `web` e `worker`
- severidade: medio
- categoria: health
- status: confirmado
- resumo: `apps/api/src/routers/health.ts` tem `live`/`ready` com checks de DB/Redis/outbox (bom). `apps/web/src/app/api/health/route.ts` faz apenas `SELECT 1` e não checa Redis. `apps/worker/src/health-server.ts` checa outbox lag mas não DLQ depth nem workers pausados.

#### Evidencia
- arquivo_ou_area: apps/api/src/routers/health.ts; apps/web/src/app/api/health/route.ts; apps/worker/src/health-server.ts

#### Impacto
- tecnico: Orquestrador recebe sinais divergentes
- negocio: Readiness falha ou passa fora da realidade

#### Recomendacao
- acao_sugerida: Padrão comum (live/ready/startup) com checks por dependência relevante; documentar em `docs/HEALTH.md`
- prioridade: media

---

### ACH-011
- titulo: `requestId` não propaga para outbox events nem para jobs BullMQ
- severidade: medio
- categoria: correlacao
- status: confirmado
- resumo: tRPC middleware cria `requestId` e loga, mas o evento do outbox e os jobs BullMQ não carregam esse id. Correlação request → outbox → job é perdida.

#### Evidencia
- arquivo_ou_area: apps/api/src/trpc/logging-middleware.ts; apps/worker/src/processors/outbox-processor.ts; campaign-processor; packages/shared/src/events/event-publisher.ts

#### Impacto
- tecnico: "Minha venda foi processada?" exige junção por timestamp
- negocio: Suporte lento

#### Recomendacao
- acao_sugerida: Propagar `parentRequestId`/`traceparent` no payload do evento; logger do worker inclui no contexto
- prioridade: media

---

### ACH-012
- titulo: Sentry sem `beforeSend` e sampling desbalanceado entre apps
- severidade: medio
- categoria: exposicao-e-observabilidade
- status: confirmado
- resumo: `apps/api/src/lib/sentry.ts` com `tracesSampleRate=0.3`, worker com `0.1`, sem `beforeSend` removendo PII/auth headers (cross-ref seguranca/ACH-021).

#### Evidencia
- arquivo_ou_area: apps/api/src/lib/sentry.ts; apps/worker/src/index.ts; apps/web/src/lib/sentry.server.config.ts

#### Impacto
- tecnico: Sample inconsistente quebra correlação
- negocio: Dados sensíveis exportados a Sentry

#### Recomendacao
- acao_sugerida: `beforeSend` com redactor; unificar sample rate e tag `service` e `environment`; usar `environment = production|staging|dev`
- prioridade: media

---

### ACH-013
- titulo: Nível de log `info` em produção amplifica volume
- severidade: baixo
- categoria: logs
- status: confirmado
- resumo: Outbox processor, campaign dispatch e messaging emitem `info` por operação. Volume cresce linear com carga; sem sampling.

#### Evidencia
- arquivo_ou_area: apps/api/src/lib/logger.ts (level info em prod); apps/worker/src/processors/*.ts

#### Impacto
- tecnico: Custo de stdout/Docker logs; cache/agregador saturado
- negocio: Custo operacional e latência de parse

#### Recomendacao
- acao_sugerida: `level: 'warn'` em prod (ou `info` com amostragem 10%); `debug` no restante; expor `LOG_LEVEL` via env
- prioridade: baixa

---

### ACH-014
- titulo: Nginx sem access/error log estruturado
- severidade: baixo
- categoria: logs
- status: confirmado
- resumo: `deploy/nginx.conf` não define `log_format json_combined` nem volume de logs. Sem visibilidade de 4xx/5xx por rota, TLS handshake, latência Nginx.

#### Evidencia
- arquivo_ou_area: deploy/nginx.conf; docker-compose.prod.yml (sem volume para logs nginx)

#### Impacto
- tecnico: Abuso não detectado; latência de borda invisível
- negocio: Sem métrica de entrada

#### Recomendacao
- acao_sugerida: Log JSON + volume montado; exportar via `nginx-prometheus-exporter` ou Filebeat
- prioridade: baixa

---

### ACH-015
- titulo: Sem runbooks por alerta nem playbooks de incidente
- severidade: medio
- categoria: alerting-e-toil
- status: confirmado
- resumo: `deploy/RUNBOOKS.md` é checklist operacional genérico; sem playbooks por alerta (link `runbook_url` em cada alerta não existe).

#### Evidencia
- arquivo_ou_area: deploy/RUNBOOKS.md; deploy/alerts.yml

#### Impacto
- tecnico: On-call depende de conhecimento tácito
- negocio: MTTR alto em novos incidentes

#### Recomendacao
- acao_sugerida: Para cada alerta, `runbook_url` apontando para `docs/runbooks/<alert>.md`; template unificado (trigger, diagnóstico, mitigação, rollback)
- prioridade: media
