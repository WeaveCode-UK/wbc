# Plano de Correção

## Identificação
- dominio: confiabilidade-resiliencia
- run_id: 2026-04-19_07-38-46
- data_geracao: 2026-04-22 00:00:00
- total_achados: 17
- corrigiveis: 8
- corrigiveis_parciais: 9
- nao_corrigiveis: 0

## Ordem de Execução

### 1. ACH-001 — event-subscriber marca processedAt mesmo com handler falhando
- severidade: critico
- classificacao: corrigivel
- arquivo_ou_area_afetada: packages/shared/src/events/event-subscriber.ts
- acao_planejada: alterar dispatch() para propagar resultado de Promise.allSettled; se qualquer handler rejeitar, NÃO marcar processedAt (deixar para retry) e logar metadata do handler que falhou.
- dependencias: nenhuma
- justificativa_ordem: invariância básica do outbox; pré-requisito dos ACHs 002 e 008.
- risco_da_correcao: baixo; apenas muda condição de markProcessed.

### 2. ACH-002 — Handlers do outbox não são idempotentes (processed_events)
- severidade: critico
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: packages/db (prisma schema + migration); packages/shared/src/events/event-subscriber.ts; packages/business/**/handlers/*.ts
- acao_planejada: criar migration Prisma para tabela `processed_events(handler TEXT, event_id UUID, tenant_id TEXT, processed_at)` com PK(handler, event_id); adicionar helper `withIdempotency(handlerName, eventId, tenantId, fn)` em shared; aplicar em pelo menos um handler piloto (inventory/sale-confirmed); documentar rollout restante em docs/RELIABILITY-FOLLOWUP.md.
- dependencias: ACH-001
- justificativa_ordem: precisa do ACH-001 para não contar com markProcessed falho.
- risco_da_correcao: medio; migration toca schema mas é aditiva (CREATE TABLE).

### 3. ACH-008 — Combinação claim racy + handlers duplicáveis
- severidade: alto
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: packages/db/src/outbox/prisma-outbox-repository.ts; cross-ref dados-persistencia/ACH-002 (já tratado em run 2026-04-18_23-03-36)
- acao_planejada: validar que claimPending usa SELECT FOR UPDATE SKIP LOCKED (já entregue em dados-persistencia); registrar cross-ref e complementar com helper idempotente (ACH-002) no handler piloto; documentar plano de expansão.
- dependencias: ACH-001, ACH-002
- justificativa_ordem: depende dos dois anteriores para pode ser endereçada.
- risco_da_correcao: baixo.

### 4. ACH-004 — outbox-processor sem timeout por handler
- severidade: alto
- classificacao: corrigivel
- arquivo_ou_area_afetada: apps/worker/src/processors/outbox-processor.ts; packages/shared/src/events/event-subscriber.ts
- acao_planejada: envelopar dispatch com Promise.race(handler(), timeout(handlerTimeoutMs)); HANDLER_TIMEOUT_MS configurável via env; métricas de timeout.
- dependencias: ACH-001
- justificativa_ordem: complementa ACH-001 (um handler travado não deve bloquear dispatch inteiro).
- risco_da_correcao: baixo.

### 5. ACH-010 — Backoff do outbox sem jitter
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: packages/db/src/outbox/prisma-outbox-repository.ts
- acao_planejada: adicionar jitter aleatório (+/- 50%) ao backoffMs.
- dependencias: nenhuma
- justificativa_ordem: arquivo próximo ao ACH-008/011; agrupar edições.
- risco_da_correcao: muito baixo.

### 6. ACH-011 — Isolamento fraco por tenant no claimPending
- severidade: medio
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: packages/db/src/outbox/prisma-outbox-repository.ts; apps/worker/src/processors/outbox-processor.ts
- acao_planejada: introduzir stub de round-robin por tenant no claimPending via $queryRaw com DISTINCT ON (tenant_id); documentar limitações e follow-up se o Prisma client não expuser.
- dependencias: ACH-010 (mesmo arquivo)
- justificativa_ordem: proximidade de arquivo com ACH-010.
- risco_da_correcao: medio (SQL direto).

### 7. ACH-013 — Retenção do outbox (cleanup agressivo)
- severidade: medio
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: apps/worker/src/processors/outbox-cleanup.ts; docs/RETENTION.md
- acao_planejada: tornar janela configurável (OUTBOX_RETENTION_DAYS, default 30); criar docs/RETENTION.md documentando política; cold storage é follow-up humano.
- dependencias: nenhuma
- justificativa_ordem: finaliza trilha do outbox.
- risco_da_correcao: baixo.

### 8. ACH-003 — Queues BullMQ sem limite de profundidade
- severidade: alto
- classificacao: corrigivel
- arquivo_ou_area_afetada: apps/api/src/lib/queues.ts; apps/worker/src/queues/*
- acao_planejada: centralizar defaultJobOptions com { removeOnComplete: 1000, removeOnFail: 5000, attempts: 3, backoff: { type: 'exponential', delay: 5000 } } em helper compartilhado.
- dependencias: nenhuma
- justificativa_ordem: mudança isolada em queues.
- risco_da_correcao: baixo.

### 9. ACH-005 — docker sem stop_grace_period alinhado ao shutdown de 30s
- severidade: alto
- classificacao: corrigivel
- arquivo_ou_area_afetada: docker-compose.prod.yml; docker-compose.yml (opcional)
- acao_planejada: adicionar `stop_grace_period: 40s` ao serviço worker; registrar motivo em comentário.
- dependencias: nenhuma
- justificativa_ordem: configuração isolada.
- risco_da_correcao: muito baixo.

### 10. ACH-007 — Sem backpressure entre tRPC e outbox
- severidade: alto
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: apps/api/src/trpc/*; packages/shared/src/events/event-publisher.ts
- acao_planejada: criar middleware tRPC `outboxBackpressureMiddleware` que consulta lag do outbox (via cache em memória atualizado por poll) e rejeita mutations marcadas como event-producing com TRPCError TOO_MANY_REQUESTS + Retry-After. Aplicar opcionalmente em sales.confirm (piloto) e documentar rollout.
- dependencias: nenhuma
- justificativa_ordem: API-side, independente do worker.
- risco_da_correcao: medio (middleware novo).

### 11. ACH-006 — DLQ sem replay automatizado
- severidade: alto
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: apps/api/src/routers/admin.ts (novo); apps/worker/src/processors/dlq-processor.ts; scripts/dlq-replay.ts (novo CLI)
- acao_planejada: adicionar procedure tRPC `admin.dlq.replay(id)` protegida por role ADMIN que move evento de DLQ → PENDING; criar CLI simples `pnpm run dlq:replay -- --id=...` e alerta estruturado quando evento entra em DLQ.
- dependencias: nenhuma (mas se já houver admin router, reutilizar)
- justificativa_ordem: funcionalidade operacional independente.
- risco_da_correcao: medio.

### 12. ACH-012 — Thresholds de circuit breaker hardcoded
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: packages/shared/src/resilience/policies.ts (novo ou estendido); packages/business/messaging/adapters/whatsapp-n2-adapter.ts; packages/business/ai/adapters/deepseek-adapter.ts
- acao_planejada: extrair thresholds para helper central lendo env (WHATSAPP_CIRCUIT_THRESHOLD, etc.).
- dependencias: nenhuma
- justificativa_ordem: agrupar com ACH-014/015 (resilience).
- risco_da_correcao: baixo.

### 13. ACH-015 — Deadline / budget propagation
- severidade: medio
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: packages/shared/src/resilience/deadline.ts (novo); packages/business/messaging/adapters/whatsapp-n2-adapter.ts
- acao_planejada: helper `withDeadline(budgetMs, fn)` usando AbortSignal.timeout; piloto aplicado ao adapter WhatsApp; documentar rollout completo.
- dependencias: ACH-012
- justificativa_ordem: mesmo diretório de policies.
- risco_da_correcao: baixo.

### 14. ACH-014 — Stubs MP/Resend sem template de resiliência
- severidade: medio
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: packages/shared/src/adapters/external-adapter-template.ts (novo); docs/ADAPTERS.md
- acao_planejada: criar template abstrato (timeout + retry + circuit + fallback) e doc de uso; não converter stubs ainda (decisão de negócio).
- dependencias: ACH-012
- justificativa_ordem: segue a família de resiliência.
- risco_da_correcao: baixo.

### 15. ACH-009 — Dois níveis de retry desalinhados
- severidade: medio
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: docs/adr/007-outbox-pattern.md (ou adr novo); packages/shared/src/resilience/retry.ts
- acao_planejada: ADR documentando os dois níveis (adapter curto, outbox longo), regras de uso e jitter; pequeno comentário no retry.ts.
- dependencias: ACH-010 (jitter aplicado antes)
- justificativa_ordem: documentação consolidada após ajustes de retry.
- risco_da_correcao: nenhum.

### 16. ACH-016 — Load shedding adaptativo
- severidade: baixo
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: apps/api/src/trpc/rate-limit-middleware.ts; docs/RELIABILITY-FOLLOWUP.md
- acao_planejada: semear hook (comentário + stub `shouldShed(p95)`) sem ativar; documentar follow-up.
- dependencias: nenhuma
- justificativa_ordem: baixa prioridade; fim da fila.
- risco_da_correcao: nenhum.

### 17. ACH-017 — Circuit breakers sem coordenação
- severidade: baixo
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: docs/runbooks/multi-provider-incident.md (novo)
- acao_planejada: runbook manual documentando priorização entre providers em crise; agregador central é follow-up.
- dependencias: nenhuma
- justificativa_ordem: fim da fila.
- risco_da_correcao: nenhum.

## Achados Não Corrigíveis

Nenhum.

## Resumo do Plano
- Total a corrigir: 8 corrigiveis + 9 corrigiveis_parciais = 17
- Parcial (requer validação humana ou follow-up): 9
- Não corrigível: 0
- Estimativa de commits: ~17 (1 por ACH) + 1 init + 1 transição + 1 relatório + eventuais review-fix + type-check/build fixes
