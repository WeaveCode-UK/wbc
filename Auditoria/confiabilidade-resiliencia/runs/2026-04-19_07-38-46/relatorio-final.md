# Relatório Final da Auditoria

## Identificação
- dominio: confiabilidade-resiliencia
- run_id: 2026-04-19_07-38-46
- status_run: ready_for_finalize
- iniciado_em: 2026-04-19 07:38:46
- finalizado_em: none
- ultima_atualizacao: 2026-04-19 08:00:00

## Objetivo da Run
Avaliar se a plataforma WBC mantém correção e continuidade sob falhas, saturação, retries e recuperação.

## Escopo Executado
- Outbox pattern (publisher, subscriber, repositório, workers)
- Adapters externos com resilience (WhatsApp-N2, DeepSeek)
- Middlewares tRPC (rate-limit) e BullMQ queues
- ADRs 007 (resilience) e 008 (worker scaling)
- Graceful shutdown x `stop_grace_period` do Docker Compose

## Escopo Nao Coberto ou Parcial
- Testes de chaos (injeção real de falha)
- Medição empírica de MTTR/MTBF
- Failover real de Redis/Postgres (cross-ref infraestrutura-deploy-config)

## Resumo Executivo
O desenho de resiliência tem bons padrões (outbox at-least-once, circuit breakers, retries com backoff, graceful shutdown), mas a execução revela 2 achados críticos e 6 altos que minam a garantia de correção: `event-subscriber` marca `processedAt` mesmo com handler falhando; handlers não são idempotentes; filas BullMQ sem limite em Redis de 256 MB; outbox-processor sem timeout por handler; `docker-compose.prod.yml` sem `stop_grace_period` impede drain; DLQ sem replay automático; ausência de backpressure entre tRPC e outbox. A combinação claim racy + handlers repetíveis (cross-ref dados-persistencia/ACH-002) garante duplicidade. Avaliação geral: `preocupante`.

## Principais Achados
1. ACH-001 (critico) `event-subscriber` marca processed mesmo com handler falhando
2. ACH-002 (critico) handlers não idempotentes
3. ACH-003 (alto) fila BullMQ sem limite + Redis 256 MB
4. ACH-004 (alto) outbox-processor sem timeout por handler
5. ACH-005 (alto) sem `stop_grace_period` no Docker Compose
6. ACH-006 (alto) DLQ sem replay automático
7. ACH-007 (alto) ausência de backpressure tRPC ↔ outbox
8. ACH-008 (alto) combinação claim racy + handlers repetíveis

## Distribuicao por Severidade
- critico: 2
- alto: 6
- medio: 7
- baixo: 2
- informativo: 0

## Riscos Prioritarios
1. Invariantes silenciosamente violadas (ACH-001 + ACH-002)
2. Redis saturado derruba sistema (ACH-003)
3. Worker travado → cascata (ACH-004 + ACH-005)
4. Incidente com DLQ = SQL manual (ACH-006)
5. API aceita carga quando lag está alto (ACH-007)

## Recomendacoes Prioritarias
1. `event-subscriber` só marca processed se todos os handlers tiverem sucesso (ACH-001).
2. Tabela `processed_events(handler, event_id)` com insert no mesmo tx (ACH-002, ACH-008).
3. `defaultJobOptions { removeOnComplete, removeOnFail }` + alertas (ACH-003).
4. `Promise.race` com timeout por handler (ACH-004).
5. `stop_grace_period: 40s`; reset job para PROCESSING > 5 min (ACH-005).
6. CLI/admin para replay de DLQ + alerta ao entrar (ACH-006).
7. Middleware tRPC com `Retry-After` quando lag alto (ACH-007).
8. Alinhar e documentar retries; adicionar jitter (ACH-009, ACH-010).
9. Template de adapter externo (ACH-014).
10. Deadlines via AbortSignal; load shedding adaptativo (ACH-015, ACH-016).

## Avaliacao Geral do Dominio
- avaliacao: preocupante

Justificativa: fundação adequada, mas composição atual permite inconsistência silenciosa e amplifica falhas locais.

## Prontidao para Encerramento
- pronto_para_finalizar: sim
- justificativa: 7 fases concluídas; 17 achados consolidados; sem bloqueios.

## Observacoes Finais
- ACH-001/002/008 ↔ apis-integracoes/ACH-001 e dados-persistencia/ACH-002.
- ACH-003/005 ↔ infraestrutura-deploy-config.
- ACH-006/007 ↔ observabilidade-operacao.
- ACH-014 ↔ supply-chain-dependencias.
