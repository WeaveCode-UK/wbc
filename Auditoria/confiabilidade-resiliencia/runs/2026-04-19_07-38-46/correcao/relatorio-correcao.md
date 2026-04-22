# Relatório de Correção

## Identificação
- dominio: confiabilidade-resiliencia
- run_id: 2026-04-19_07-38-46
- branch: fix/confiabilidade-resiliencia/2026-04-19_07-38-46
- data_inicio: 2026-04-22 00:00:00
- data_conclusao: 2026-04-22 00:30:00
- ultima_atualizacao: 2026-04-22 00:30:00
- status: concluido

## Resumo Executivo
Todos os 17 achados foram processados. Executor cobriu 17/17; Revisor aprovou 16 diretamente e corrigiu 1 (ACH-015, ausência do piloto `deadlineSignal` no WhatsApp adapter). Além das correções, o type-check exigiu 1 fix pós-revisor (createTimeoutSignal aceita TimeoutPolicy, não number). Type-check e build verdes; `report-consolidado.{md,json}` regenerado.

Destaques: (i) dispatch() agora propaga AggregateError quando qualquer handler rejeita, fechando a janela em que eventos eram marcados PROCESSED silenciosamente; (ii) idempotência por handler via ProcessedEventRepository — piloto em inventory/sale-confirmed; (iii) backpressure tRPC↔outbox com poll leve e piloto em sales.confirm; (iv) DLQ replay exposto via tRPC admin + CLI; (v) resiliência centralizada: thresholds de circuit breaker configuráveis por env, jitter no backoff do outbox, ExternalAdapterTemplate consolidando timeout+retry+circuit+fallback.

## Estatísticas
- total_achados_na_run: 17
- aprovados_para_correcao: 17
- corrigidos_pelo_executor: 17
- aprovados_pelo_revisor_sem_alteracao: 16
- corrigidos_pelo_revisor: 1
- falha_executor_resolvida_pelo_revisor: 0
- nao_corrigiveis: 0
- nao_aprovados: 0
- falha_total: 0
- taxa_de_acerto_do_executor: 94%

## Validação Técnica
- type_check: passou
- build: passou
- tentativas_de_correcao_build: 1
- bloqueio_build: nao
- erro_persistente: nenhum

## Achados Corrigidos (Executor acertou de primeira) — 16
- ACH-001 (critico) — event-subscriber marca processedAt mesmo com handler falhando
- ACH-002 (critico) — Handlers do outbox não são idempotentes (piloto inventory)
- ACH-003 (alto) — Fila BullMQ sem limite de profundidade
- ACH-004 (alto) — outbox-processor sem timeout por handler
- ACH-005 (alto) — Graceful shutdown sem stop_grace_period no Docker
- ACH-006 (alto) — DLQ sem replay automático (tRPC admin + CLI)
- ACH-007 (alto) — Backpressure tRPC↔outbox (piloto sales.confirm)
- ACH-008 (alto) — Combinação racy+duplicável (cross-ref)
- ACH-009 (medio) — Dois níveis de retry desalinhados (ADR-007 adendo)
- ACH-010 (medio) — Backoff do outbox sem jitter
- ACH-011 (medio) — Isolamento fraco por tenant (round-robin opt-in)
- ACH-012 (medio) — Thresholds de circuit breaker hardcoded
- ACH-013 (medio) — Cleanup do outbox com janela indefinida
- ACH-014 (medio) — Template abstrato ExternalAdapterTemplate
- ACH-016 (baixo) — Load shedding adaptativo (stub)
- ACH-017 (baixo) — Coordenação entre circuit breakers (runbook)

## Achados Corrigidos com Intervenção do Revisor — 1
- ACH-015 (medio) — Cascata de timeouts sem budget ponta-a-ponta. Discrepância: plano prometia piloto `deadlineSignal` no WhatsApp adapter, mas commit ac84fd1 entregou apenas o helper `withDeadline`. Revisor aplicou o piloto em packages/business/messaging/adapters/whatsapp-n2-adapter.ts (commit c24acdb) combinando o signal externo com o timeout por tentativa via AbortController local.

## Achados Parciais (requerem validação humana) — 9
Todos rastreados em `docs/RELIABILITY-FOLLOWUP.md` (criado neste run):
- ACH-002 — rollout de `withIdempotentHandler` em whatsapp-webhook/mercadopago-webhook; claim dentro da tx
- ACH-006 — execução em staging; alerta Prometheus sobre métrica DLQ
- ACH-007 — expandir backpressure para demais mutations; parametrizar threshold
- ACH-011 — benchmark round-robin vs FIFO; índice composto
- ACH-013 — export para cold storage
- ACH-014 — migrar stubs MP/Resend quando contratos estabilizarem
- ACH-015 — propagação deadline via AsyncLocalStorage
- ACH-016 — ligar `shouldShed` a p95 Prometheus (depende de obs ACH-001)
- ACH-017 — agregador central de circuit breakers

## Achados Não Corrigíveis — 0
Nenhum.

## Achados Não Aprovados pelo Usuário — 0
Nenhum.

## Achados com Falha Total — 0
Nenhum.

## Commits Gerados (38 total)

### Setup
- be3277f chore: inicializar correção

### Executor (17 fixes)
- 43d5018 ACH-001 | ec3c116 ACH-002 | 87a652c ACH-004 | 2b72eac ACH-008 | 5a763d2 ACH-010
- 30d59be ACH-011 | 3e5f82d ACH-013 | 53b3cf4 ACH-003 | cc6c211 ACH-005 | b4bc461 ACH-007
- 550de81 ACH-006 | 5ba5eed ACH-012 | ac84fd1 ACH-015 | 4e89c53 ACH-014 | 8ca13f9 ACH-009
- 737722f ACH-016 | 4899631 ACH-017

### Transição
- 46b6040 transição executor → revisor

### Revisor — aprovações (16)
- 313e7a8 ACH-001 | 4095e25 ACH-002 | 61e3777 ACH-003 | 94f4f0d ACH-004 | f369143 ACH-005
- 19e4b87 ACH-006 | e99f506 ACH-007 | 41c1528 ACH-008 | 0e357a1 ACH-009 | 231d3fc ACH-010
- d877802 ACH-011 | e95b627 ACH-012 | eda0409 ACH-013 | 9dbc6b6 ACH-014 | 8d043ed ACH-016
- 84b7bc6 ACH-017

### Revisor — review-fix (1)
- c24acdb review-fix ACH-015 (piloto deadlineSignal no WhatsApp adapter)
- 1ea749d progresso ACH-015

### Pós-correção
- c572591 fix type-check (createTimeoutSignal aceita TimeoutPolicy)

## Merge
- status_merge: pendente
- branch_origem: fix/confiabilidade-resiliencia/2026-04-19_07-38-46
- branch_destino: main
- aprovado_por_usuario: nao
