# Progresso da Correção

## Identificação
- dominio: confiabilidade-resiliencia
- run_id: 2026-04-19_07-38-46
- branch: fix/confiabilidade-resiliencia/2026-04-19_07-38-46
- data_inicio: 2026-04-22 00:00:00
- ultima_atualizacao: 2026-04-22 00:00:00
- fase_atual: revisor
- status: em_andamento

## Resumo de Progresso
- total_aprovados: 17
- corrigidos_executor: 17
- revisados_revisor: 0
- corrigidos_pelo_revisor: 0
- nao_corrigiveis: 0
- nao_aprovados: 0
- pendentes: 0

## Achados

### ACH-001
- titulo: event-subscriber marca processedAt mesmo com handler falhando
- severidade: critico
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 43d5018
- commit_revisor: none
- arquivos_alterados:
  - packages/shared/src/events/event-subscriber.ts
- descricao_correcao: dispatch() propaga AggregateError quando qualquer handler rejeita; outbox-processor chama markFailed e evento volta a PENDING com backoff.

### ACH-002
- titulo: Handlers do outbox não são idempotentes
- severidade: critico
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: ec3c116
- commit_revisor: none
- arquivos_alterados:
  - packages/shared/src/events/event-subscriber.ts (EventHandler.id exposto)
  - packages/business/inventory/adapters/sale-confirmed-handler.ts (piloto)
  - docs/RELIABILITY-FOLLOWUP.md
- descricao_correcao: piloto em sale-confirmed usa withIdempotentHandler (infra já vinha de dados-persistencia run 2026-04-18_23-03-36). Rollout nos demais handlers em RELIABILITY-FOLLOWUP.md.

### ACH-003
- titulo: Fila BullMQ sem limite de profundidade
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 53b3cf4
- commit_revisor: none
- arquivos_alterados:
  - apps/api/src/lib/queues.ts
  - apps/worker/src/queues/index.ts
- descricao_correcao: defaultJobOptions { removeOnComplete:1000, removeOnFail:5000, attempts:3, backoff:exponential 5s } centralizados em todas as queues (producer + consumer).

### ACH-004
- titulo: outbox-processor sem timeout por handler
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 87a652c
- commit_revisor: none
- arquivos_alterados:
  - packages/shared/src/events/event-subscriber.ts
- descricao_correcao: HANDLER_TIMEOUT_MS env-configurável; HandlerTimeoutError diferenciado no log para diagnose.

### ACH-005
- titulo: Graceful shutdown 30s sem stop_grace_period no Docker
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: cc6c211
- commit_revisor: none
- arquivos_alterados:
  - docker-compose.prod.yml
- descricao_correcao: stop_grace_period: 40s no serviço worker.

### ACH-006
- titulo: DLQ sem replay automático
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 550de81
- commit_revisor: none
- arquivos_alterados:
  - packages/db/src/outbox/prisma-outbox-repository.ts (replayFromDLQ, listDLQ)
  - apps/api/src/routers/admin.ts (novo)
  - apps/api/src/trpc/router.ts
  - scripts/dlq-replay.ts (CLI)
- descricao_correcao: admin.dlq.list/replay (ADMIN-only) + CLI via pnpm tsx scripts/dlq-replay.ts.

### ACH-007
- titulo: Ausência de backpressure entre tRPC e outbox
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: b4bc461
- commit_revisor: none
- arquivos_alterados:
  - apps/api/src/lib/outbox-lag-monitor.ts (novo)
  - apps/api/src/trpc/outbox-backpressure-middleware.ts (novo)
  - apps/api/src/routers/sales.ts (piloto em confirm)
  - apps/api/src/index.ts (start do monitor)
- descricao_correcao: poll em background + applyOutboxBackpressure(path) em sales.confirm; rollout nas demais mutations em RELIABILITY-FOLLOWUP.md.

### ACH-008
- titulo: Claim racy + handlers repetíveis (combinação)
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 2b72eac
- commit_revisor: none
- arquivos_alterados:
  - packages/db/src/outbox/prisma-outbox-repository.ts
- descricao_correcao: cross-ref com SKIP LOCKED (dados-persistencia ACH-002) + ACH-001 + ACH-002 deste run; comentário consolidado no claimPending.

### ACH-009
- titulo: Dois mecanismos de retry desalinhados
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 8ca13f9
- commit_revisor: none
- arquivos_alterados:
  - docs/adr/007-resilience-strategies.md
- descricao_correcao: adendo com tabela comparativa dos 3 níveis (adapter/outbox/BullMQ) e regra de uso.

### ACH-010
- titulo: Backoff do outbox sem jitter
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 5a763d2
- commit_revisor: none
- arquivos_alterados:
  - packages/db/src/outbox/prisma-outbox-repository.ts
- descricao_correcao: backoff = base + random(-50%, +50%); previne thundering herd.

### ACH-011
- titulo: Isolamento fraco por tenant no claimPending
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 30d59be
- commit_revisor: none
- arquivos_alterados:
  - packages/db/src/outbox/prisma-outbox-repository.ts
- descricao_correcao: claimPendingRoundRobin com DISTINCT ON (tenant_id); opt-in via OUTBOX_CLAIM_STRATEGY=round_robin.

### ACH-012
- titulo: Thresholds de circuit breaker hardcoded
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 5ba5eed
- commit_revisor: none
- arquivos_alterados:
  - packages/shared/src/resilience/policies.ts
  - packages/business/messaging/adapters/whatsapp-n2-adapter.ts
  - packages/business/ai/adapters/deepseek-adapter.ts
- descricao_correcao: whatsappCircuitPolicy e deepseekCircuitPolicy lidos de env; adapters referenciam as policies centrais.

### ACH-013
- titulo: Cleanup do outbox com janela indefinida
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 3e5f82d
- commit_revisor: none
- arquivos_alterados:
  - apps/worker/src/processors/outbox-cleanup.ts
  - docs/RETENTION.md
- descricao_correcao: OUTBOX_RETENTION_DAYS env (default 30); docs/RETENTION.md documenta política; cold storage em follow-up.

### ACH-014
- titulo: Stubs MP/Resend sem padrão de resiliência
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 4e89c53
- commit_revisor: none
- arquivos_alterados:
  - packages/shared/src/adapters/external-adapter-template.ts (novo)
  - packages/shared/src/index.ts
  - docs/ADAPTERS.md
- descricao_correcao: template abstrato ExternalAdapterTemplate combinando timeout+retry+circuit+fallback; convenção em docs/ADAPTERS.md.

### ACH-015
- titulo: Cascata de timeouts sem budget ponta-a-ponta
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: ac84fd1
- commit_revisor: none
- arquivos_alterados:
  - packages/shared/src/resilience/deadline.ts (novo)
  - packages/shared/src/resilience/index.ts
- descricao_correcao: withDeadline(budgetMs, fn) cria AbortSignal compartilhado; propagação via ALS em follow-up.

### ACH-016
- titulo: Rate-limit sem load shedding adaptativo
- severidade: baixo
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 737722f
- commit_revisor: none
- arquivos_alterados:
  - apps/api/src/trpc/rate-limit-middleware.ts
- descricao_correcao: shouldShed(p95) stub opt-in via ADAPTIVE_SHEDDING=1 (off por default); lógica real depende de métrica Prometheus (observabilidade).

### ACH-017
- titulo: Circuit breakers sem sinalização cruzada
- severidade: baixo
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 4899631
- commit_revisor: none
- arquivos_alterados:
  - docs/runbooks/multi-provider-incident.md (novo)
- descricao_correcao: runbook manual com priorização e procedimentos; agregador central é follow-up.
