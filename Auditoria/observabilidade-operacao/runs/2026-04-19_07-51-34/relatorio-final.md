# Relatório Final da Auditoria

## Identificação
- dominio: observabilidade-operacao
- run_id: 2026-04-19_07-51-34
- status_run: ready_for_finalize
- iniciado_em: 2026-04-19 07:51:34
- finalizado_em: none
- ultima_atualizacao: 2026-04-19 08:15:00

## Objetivo da Run
Avaliar a capacidade da plataforma de emitir sinais úteis, correlacionar logs/métricas/traces, expor saúde, alertar incidentes e reduzir toil operacional.

## Escopo Executado
- Tracing (OpenTelemetry) e Sentry
- Pino logger e security-logger
- Prometheus (`deploy/prometheus.yml`, `deploy/alerts.yml`)
- Grafana (presença no compose, sem provisioning)
- Health endpoints nos três apps
- Nginx logs

## Escopo Nao Coberto ou Parcial
- Validação empírica de alertas com fault injection
- Análise de custos de observabilidade (Sentry sample, log volume) — cross-ref `custos-finops`
- Políticas de retenção de logs — cross-ref `compliance-privacidade`

## Resumo Executivo
A observabilidade do WBC tem ingredientes (OpenTelemetry, Sentry, Pino estruturado, Prometheus + Grafana no compose, health endpoints), mas a maior parte do "tecido" que liga esses sinais está ausente: Prometheus só scrapea a web; OpenTelemetry e Sentry não compartilham `traceId`; Grafana não tem dashboards provisionados; Alertmanager/canais de alerta inexistem; DLQ acumula sem métrica nem alarme; PII aparece em logs; métricas de infra (Prisma pool, Redis, BullMQ depth) não estão coletadas; SLIs/SLOs não estão documentados. Operar o sistema hoje depende de conhecimento tácito. Avaliação: `preocupante`.

## Principais Achados
1. ACH-001 (alto) Prometheus só cobre web
2. ACH-002 (alto) OTel/Sentry/logs sem correlação por `traceId`
3. ACH-003 (alto) PII em logs
4. ACH-004 (alto) DLQ sem dashboard/alerta/retry automático
5. ACH-005 (alto) métricas de infra ausentes
6. ACH-006 (alto) alertas sem Alertmanager/canais
7. ACH-007 (alto) sem SLIs/SLOs formais
8. ACH-008 (medio) Grafana sem provisioning
9. ACH-009 (medio) fluxos críticos sem spans manuais
10. ACH-010 (medio) health checks inconsistentes entre apps
11. ACH-011 (medio) `requestId` não propaga a outbox/jobs
12. ACH-015 (medio) ausência de runbooks por alerta

## Distribuicao por Severidade
- critico: 0
- alto: 7
- medio: 6
- baixo: 2
- informativo: 0

## Riscos Prioritarios
1. Incidentes sem alerta (ACH-006) → MTTR alto
2. PII em logs (ACH-003) → risco LGPD
3. Debug fragmentado (ACH-002, ACH-011) → dias para um incidente
4. Saturação invisível (ACH-005) → queda súbita
5. DLQ silencioso (ACH-004) → perda de eventos

## Recomendacoes Prioritarias
1. Adicionar `/metrics` a api e worker, jobs Prometheus correspondentes (ACH-001).
2. Propagar `traceparent`/`traceId` em Pino + Sentry + payload de eventos (ACH-002, ACH-011).
3. Redactor Pino para PII (ACH-003); aplicar em security-logger e adapters.
4. Instrumentar Prisma pool, ioredis, BullMQ depth, outbox lag, DLQ depth (ACH-004, ACH-005).
5. Definir SLIs/SLOs e publicar `docs/SLO.md` (ACH-007); derivar alertas desses SLOs.
6. Instalar Alertmanager + integração Slack/PagerDuty; `runbook_url` em cada alerta (ACH-006, ACH-015).
7. Provisionamento declarativo do Grafana (datasources + dashboards JSON) (ACH-008).
8. Spans manuais em use-cases críticos; `tenantId`/`action` como atributos (ACH-009).
9. Padronizar health checks (live/ready/startup) com cobertura de dependências (ACH-010).
10. Sentry: `beforeSend` com redactor; unificar sample rate; log level em prod controlado via env (ACH-012, ACH-013, ACH-014).

## Avaliacao Geral do Dominio
- avaliacao: preocupante

Justificativa: ingredientes certos mas pouco integrados; operar o sistema sem incidentes requer sorte e conhecimento tácito.

## Prontidao para Encerramento
- pronto_para_finalizar: sim
- justificativa: 7 fases concluídas; 15 achados consolidados; sem bloqueios.

## Observacoes Finais
- ACH-003 ↔ seguranca/ACH-019/020; compliance-privacidade.
- ACH-004/006 ↔ confiabilidade-resiliencia.
- ACH-007 ↔ performance-escalabilidade.
- ACH-010 ↔ infraestrutura-deploy-config.
