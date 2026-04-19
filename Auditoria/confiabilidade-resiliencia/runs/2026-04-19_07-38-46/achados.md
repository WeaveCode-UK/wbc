# Achados da Auditoria

## Identificação
- dominio: confiabilidade-resiliencia
- run_id: 2026-04-19_07-38-46
- ultima_atualizacao: 2026-04-19 08:00:00

## Severidades / Status
- critico · alto · medio · baixo · informativo
- aberto · confirmado · mitigado · resolvido · aceito · nao_aplicavel

## Achados Registrados

### ACH-001
- titulo: `event-subscriber` usa `Promise.allSettled` e marca `processedAt` mesmo com handler falhando
- severidade: critico
- categoria: recuperacao-e-consistencia
- status: confirmado
- resumo: `dispatch()` em `packages/shared/src/events/event-subscriber.ts` executa `Promise.allSettled(handlers...)` e, no fim, chama `markProcessed()` do outbox sempre. Se um handler (ex.: `sale-confirmed-handler`) falhar, o evento é considerado processado — estado fica inconsistente sem replay automático.

#### Evidencia
- arquivo_ou_area: packages/shared/src/events/event-subscriber.ts:34-44; packages/business/inventory/adapters/sale-confirmed-handler.ts:8-11

#### Impacto
- tecnico: Invariantes violadas silenciosamente (venda confirmada sem baixa de estoque)
- negocio: Divergência entre estado de domínio e realidade — overselling, cashback incorreto, relatórios errados

#### Recomendacao
- acao_sugerida: Falhas em qualquer handler devem retornar o evento a PENDING (ou promovê-lo a DLQ) — não marcar `processedAt`; logar metadata do handler que falhou; combinar com idempotência por handler (ACH-002)
- prioridade: alta

---

### ACH-002
- titulo: Handlers do outbox não são idempotentes — retry duplica efeitos
- severidade: critico
- categoria: idempotencia
- status: confirmado
- resumo: Handlers (inventory, messaging, analytics) não recebem chave de idempotência nem persistem "já processado". Cruzado com ACH-002 de `dados-persistencia` (claimPending racy) e ACH-001 de `apis-integracoes` (idempotência opcional).

#### Evidencia
- arquivo_ou_area: packages/business/**/handlers/*.ts; packages/shared/src/events/event-subscriber.ts
- detalhe: Um único evento reenviado duplica estoque, cashback e mensagem

#### Impacto
- tecnico: Dupla execução em retry
- negocio: Prejuízo financeiro e reputacional

#### Recomendacao
- acao_sugerida: Tabela `processed_events(handler, event_id PK, tenant_id)`; cada handler insere e executa no mesmo `$transaction`; conflito = no-op
- prioridade: alta

---

### ACH-003
- titulo: Fila BullMQ sem limite de profundidade; Redis 256 MB pode saturar
- severidade: alto
- categoria: overload-e-backpressure
- status: confirmado
- resumo: As queues (`messaging`, `campaigns`, `analytics`, `schedule`) são criadas sem `defaultJobOptions.removeOnComplete`/`removeOnFail` nem limite máximo. Com falha prolongada, a fila cresce até estourar o `maxmemory` (256 MB) definido no `docker-compose.prod.yml`.

#### Evidencia
- arquivo_ou_area: apps/api/src/lib/queues.ts; apps/worker/src/queues/*; docker-compose.prod.yml (redis `--maxmemory 256mb`)

#### Impacto
- tecnico: Redis OOM derruba cache e BullMQ
- negocio: Indisponibilidade total cascata

#### Recomendacao
- acao_sugerida: `defaultJobOptions: { removeOnComplete: 1000, removeOnFail: 5000 }`; alertar ao crescer; dimensionar `maxmemory` conforme carga esperada
- prioridade: alta

---

### ACH-004
- titulo: Outbox-processor sem timeout por handler — um handler lento trava a loop inteira
- severidade: alto
- categoria: bulkhead
- status: confirmado
- resumo: `dispatch(event)` não impõe timeout por handler. Handler travado consome o tempo da iteração e pode exceder o `HANDLER_TIMEOUT_MS` global, elevando o lag e acionando readiness failure.

#### Evidencia
- arquivo_ou_area: apps/worker/src/processors/outbox-processor.ts:13-20
- detalhe: Sem `AbortSignal`/`setTimeout` dentro do dispatch

#### Impacto
- tecnico: Cascata de restarts; outbox cresce
- negocio: Degradação silenciosa virando crise

#### Recomendacao
- acao_sugerida: Envolver cada handler em `Promise.race([fn(), timeoutPromise])`; marcar como falhado e continuar a loop; métricas por handler
- prioridade: alta

---

### ACH-005
- titulo: Graceful shutdown de worker (30s) sem `stop_grace_period` no Docker Compose
- severidade: alto
- categoria: recuperacao
- status: confirmado
- resumo: O worker implementa shutdown longo (30 s) para drenar jobs; mas `docker-compose.prod.yml` usa default (10 s). Docker envia SIGKILL após 10 s, interrompendo jobs em-flight e deixando eventos `PROCESSING` órfãos.

#### Evidencia
- arquivo_ou_area: apps/worker/src/index.ts:151-222; docker-compose.prod.yml (sem `stop_grace_period`)

#### Impacto
- tecnico: Eventos presos em PROCESSING; reprocessamento manual
- negocio: Atrasos em mensageria, cashback e relatórios

#### Recomendacao
- acao_sugerida: `stop_grace_period: 40s`; job scheduled que reset `PROCESSING > 5min` para PENDING; métrica de "orphaned processing events"
- prioridade: alta

---

### ACH-006
- titulo: DLQ sem replay automático/semi-automático — requer SQL manual
- severidade: alto
- categoria: recuperacao
- status: confirmado
- resumo: `dlq-processor.ts` apenas loga; nenhum endpoint/CLI expõe replay. Reinjetar um evento crítico exige UPDATE SQL direto na tabela outbox.

#### Evidencia
- arquivo_ou_area: apps/worker/src/processors/dlq-processor.ts:12-16; ausência de rota admin ou comando audkit

#### Impacto
- tecnico: MTTR alto em incidente com DLQ
- negocio: Dependência de engenheiro disponível

#### Recomendacao
- acao_sugerida: tRPC admin `dlq.replay(id)` com role check; CLI `audkit-dlq replay --id=<>`; log estruturado e alerta ao entrar em DLQ (cross-ref apis-integracoes/ACH-020)
- prioridade: alta

---

### ACH-007
- titulo: Ausência de backpressure entre tRPC e outbox (API aceita novos eventos mesmo com lag alto)
- severidade: alto
- categoria: overload-e-backpressure
- status: confirmado
- resumo: `health/ready` detecta `outboxLagMs > 60s` e retira do balanceador, mas o tRPC segue aceitando `publish()` até ser removido. Clientes continuam gerando eventos que enchem a fila.

#### Evidencia
- arquivo_ou_area: apps/worker/src/health-server.ts:57-70; apps/api/src/trpc/trpc.ts (sem middleware que rejeite com base em lag)

#### Impacto
- tecnico: Degradação amplificada até orquestrador reagir
- negocio: Mensagens e ações acumulam atraso

#### Recomendacao
- acao_sugerida: Middleware tRPC que rejeite mutations geradoras de evento quando `outboxLagMs > threshold/2`; TRPCError `TOO_MANY_REQUESTS` + `Retry-After`
- prioridade: alta

---

### ACH-008
- titulo: Outbox sem idempotência de "claim" + handlers repetíveis — combinação racy+duplicação
- severidade: alto
- categoria: consistencia-e-recuperacao
- status: confirmado
- resumo: Soma do `claimPending` racy (cross-ref dados-persistencia/ACH-002) com handlers não idempotentes (ACH-002) produz, em cenário de multi-worker ou crash-during-processing, efeitos duplicados garantidos.

#### Evidencia
- arquivo_ou_area: packages/db/src/outbox/prisma-outbox-repository.ts:35-60; packages/shared/src/events/event-subscriber.ts; dados-persistencia/ACH-002
- detalhe: Duas falhas individuais aceitáveis viram um desastre combinadas

#### Impacto
- tecnico: Reprocessamento com efeito colateral; estado divergente
- negocio: Confiabilidade do pipeline de eventos comprometida

#### Recomendacao
- acao_sugerida: Combinar correções: `FOR UPDATE SKIP LOCKED` + `processed_events` por handler
- prioridade: alta

---

### ACH-009
- titulo: Dois mecanismos de retry desalinhados (adapter x outbox)
- severidade: medio
- categoria: retries
- status: confirmado
- resumo: Adapters (WhatsApp/DeepSeek) retentam linearmente em ~1–2 s; outbox retenta com backoff exponencial ~10/40/90 s. Interação composta não é documentada e pode multiplicar carga.

#### Evidencia
- arquivo_ou_area: packages/shared/src/resilience/retry.ts; packages/db/src/outbox/prisma-outbox-repository.ts:69-92

#### Impacto
- tecnico: Carga de retry imprevisível
- negocio: Latência percebida instável

#### Recomendacao
- acao_sugerida: Documentar em ADR-007 os dois níveis; adotar um padrão único — adapter para falhas transientes rápidas (< 5 s), outbox para persistentes (≥ 30 s); jitter em ambos
- prioridade: media

---

### ACH-010
- titulo: Backoff do outbox sem jitter — risco de thundering herd
- severidade: medio
- categoria: retries
- status: confirmado
- resumo: `backoffMs` é determinístico (10/40/90 s). Se muitos eventos falharem no mesmo instante, todos retentam exatamente no mesmo segundo.

#### Evidencia
- arquivo_ou_area: packages/db/src/outbox/prisma-outbox-repository.ts:82

#### Impacto
- tecnico: Pico súbito de carga
- negocio: Instabilidade sob incidente

#### Recomendacao
- acao_sugerida: `backoffMs = base + random(base * 0.5)`; aplicar ao adapter também
- prioridade: media

---

### ACH-011
- titulo: Isolamento fraco por tenant no worker — um tenant pode monopolizar a fila
- severidade: medio
- categoria: bulkhead
- status: confirmado
- resumo: `claimPending` não considera tenant; um tenant gerando 10k eventos consome todo o batch, deixando outros tenants starving.

#### Evidencia
- arquivo_ou_area: apps/worker/src/processors/outbox-processor.ts:8-28; docs/adr/008-worker-scaling.md

#### Impacto
- tecnico: SLA heterogêneo entre tenants
- negocio: Reclamações de tenants prejudicados

#### Recomendacao
- acao_sugerida: Round-robin por tenant no claim (ex: `DISTINCT ON (tenant_id)`); futuro: partições por tenant conforme ADR-008
- prioridade: media

---

### ACH-012
- titulo: Thresholds de circuit breaker WhatsApp hardcoded, sem ajuste em runtime
- severidade: medio
- categoria: retries-e-circuit
- status: confirmado
- resumo: `whatsapp-n2-adapter.ts` define thresholds (5 falhas / 60 s) em constantes. Sem env/override, operação não pode abrir circuito mais cedo durante um incidente.

#### Evidencia
- arquivo_ou_area: packages/business/messaging/adapters/whatsapp-n2-adapter.ts:16-18

#### Impacto
- tecnico: Resposta lenta a incidentes
- negocio: MTTR mais alto

#### Recomendacao
- acao_sugerida: Centralizar em `packages/shared/src/resilience/policies.ts` + env (`WHATSAPP_CIRCUIT_THRESHOLD`, `WHATSAPP_CIRCUIT_WINDOW_MS`)
- prioridade: media

---

### ACH-013
- titulo: Cleanup do outbox pode remover histórico relevante para auditoria
- severidade: medio
- categoria: recuperacao-e-auditoria
- status: confirmado
- resumo: `outbox-cleanup` remove `processedAt != null`; ADR-007 marca "janela a definir". Se a janela for < 30 d, auditoria/compliance perde trilha.

#### Evidencia
- arquivo_ou_area: apps/worker/src/index.ts:109-119; apps/worker/src/processors/outbox-cleanup.ts

#### Impacto
- tecnico: Perda de histórico
- negocio: Dificuldade em investigações/LGPD

#### Recomendacao
- acao_sugerida: Manter 30 d em Postgres; export para cold storage; documentar em `docs/RETENTION.md`
- prioridade: media

---

### ACH-014
- titulo: `MercadoPago` e `Resend` são stubs — não trazem padrão de resiliência aplicado
- severidade: medio
- categoria: resiliencia
- status: confirmado
- resumo: Integrações críticas estão stubadas; quando reais, precisam herdar padrão (timeout+retry+circuit+fallback). Sem template formal, risco de divergência.

#### Evidencia
- arquivo_ou_area: packages/business/auth/adapters/resend-email-sender.adapter.ts; ausência de adapter MP real

#### Impacto
- tecnico: Novos adapters podem omitir cobertura de falha
- negocio: Integrações frágeis em produção

#### Recomendacao
- acao_sugerida: Criar `packages/shared/src/adapters/external-adapter-template.ts` e regra de code-review exigindo uso
- prioridade: media

---

### ACH-015
- titulo: Cascata de timeouts não definida — sem orçamento ponta-a-ponta
- severidade: medio
- categoria: timeouts
- status: confirmado
- resumo: Handler externo tem até 30 s (3 x 10 s por tentativa). Se múltiplas dependências encadeiam, somatório excede qualquer SLA operacional. Não há "budget" por operação.

#### Evidencia
- arquivo_ou_area: packages/business/messaging/adapters/whatsapp-n2-adapter.ts:42-104 (timeout por tentativa)

#### Impacto
- tecnico: Requests pendurados
- negocio: Experiência lenta em incidente

#### Recomendacao
- acao_sugerida: Conceito de "deadline" propagado em contexto (`AbortSignal.timeout(budgetMs)` no início); adapters abortam se estourar
- prioridade: media

---

### ACH-016
- titulo: Rate-limit por rota, sem load shedding adaptativo sob degradação
- severidade: baixo
- categoria: overload
- status: confirmado
- resumo: `rate-limit-middleware` aplica limites fixos. Quando latência sobe (GC, DB lento), não há redução dinâmica; o sistema não recupera sozinho.

#### Evidencia
- arquivo_ou_area: apps/api/src/trpc/rate-limit-middleware.ts:31-45

#### Impacto
- tecnico: Fila interna cresce até crash
- negocio: UX piora sem autoajuste

#### Recomendacao
- acao_sugerida: Ajuste adaptativo baseado em p95 de latência (reduzir limite quando p95 > threshold)
- prioridade: baixa

---

### ACH-017
- titulo: Circuit breakers isolados por adapter — sem sinalização cruzada
- severidade: baixo
- categoria: resiliencia
- status: confirmado
- resumo: Cada adapter mantém seu `CircuitBreaker`. Em crise em múltiplos providers, não há mecanismo para priorizar (ex.: abaixar DeepSeek para priorizar WhatsApp).

#### Evidencia
- arquivo_ou_area: packages/business/messaging/adapters/whatsapp-n2-adapter.ts:16; packages/business/ai/adapters/deepseek-adapter.ts:15

#### Impacto
- tecnico: Coordenação impossível automaticamente
- negocio: Runbook manual em incidente múltiplo

#### Recomendacao
- acao_sugerida: (futuro) circuit breaker central com agregado; por ora documentar runbook
- prioridade: baixa
