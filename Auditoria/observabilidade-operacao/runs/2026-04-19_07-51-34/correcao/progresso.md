# Progresso da Correção

## Identificação
- dominio: observabilidade-operacao
- run_id: 2026-04-19_07-51-34
- branch: fix/observabilidade-operacao/2026-04-19_07-51-34
- data_inicio: 2026-04-22 00:35:00
- ultima_atualizacao: 2026-04-22 00:35:00
- fase_atual: executor
- status: em_andamento

## Resumo de Progresso
- total_aprovados: 15
- corrigidos_executor: 0
- revisados_revisor: 0
- corrigidos_pelo_revisor: 0
- nao_corrigiveis: 0
- nao_aprovados: 0
- pendentes: 15

## Achados

### ACH-001
- titulo: Prometheus coleta apenas web:3000 — API e Worker sem /metrics expostos
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none

### ACH-002
- titulo: OpenTelemetry e Sentry desacoplados — traceId não flui para logs/errors
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none

### ACH-003
- titulo: Logs contêm PII sem redação
- severidade: alto
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none

### ACH-004
- titulo: DLQ sem dashboard, alerta ou retry automático
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none

### ACH-005
- titulo: Sem métricas de infra (Prisma pool, Redis, BullMQ queue depth)
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none

### ACH-006
- titulo: Alertas Prometheus genéricos e sem Alertmanager
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none

### ACH-007
- titulo: Sem SLIs/SLOs formais
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none

### ACH-008
- titulo: Grafana sem datasources/dashboards provisionados
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none

### ACH-009
- titulo: Fluxos críticos sem spans manuais
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none

### ACH-010
- titulo: Health checks inconsistentes
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none

### ACH-011
- titulo: requestId não propaga para outbox events nem BullMQ jobs
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none

### ACH-012
- titulo: Sentry sem beforeSend e sampling desbalanceado
- severidade: medio
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none

### ACH-013
- titulo: Nível de log info em produção amplifica volume
- severidade: baixo
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none

### ACH-014
- titulo: Nginx sem access/error log estruturado
- severidade: baixo
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none

### ACH-015
- titulo: Sem runbooks por alerta nem playbooks de incidente
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
