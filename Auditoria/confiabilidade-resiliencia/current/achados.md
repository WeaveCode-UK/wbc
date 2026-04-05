# Achados da Auditoria

## Identificacao
- dominio: confiabilidade-resiliencia
- run_id: 2026-04-05_18-00-00
- ultima_atualizacao: 2026-04-05 18:30:00

## Severidades Permitidas
- critico, alto, medio, baixo, informativo

## Status Permitidos
- aberto, confirmado, mitigado, resolvido, aceito, nao_aplicavel

## Achados Registrados

### ACH-CR-001
- titulo: Circuit breaker implementado com 3 estados (CLOSED/OPEN/HALF_OPEN)
- severidade: informativo
- categoria: circuit-breaker
- status: confirmado
- resumo: O CircuitBreaker em packages/shared implementa corretamente os 3 estados com configuraveis failureThreshold (default 5), resetTimeoutMs (30s) e halfOpenMaxAttempts (2). Suporta fallback function.

#### Evidencia
- arquivo_ou_area: packages/shared/src/circuit-breaker.ts
- detalhe: Classe com 77 linhas, defaults razoaveis, transicao automatica OPEN->HALF_OPEN baseada em elapsed time.

#### Impacto
- tecnico: Protecao contra cascading failures em servicos externos.
- negocio: Sistema se mantem parcialmente funcional durante falhas.

#### Recomendacao
- acao_sugerida: Nenhuma. Implementacao solida.
- prioridade: nenhuma

---

### ACH-CR-002
- titulo: Outbox pattern com claim atomico e exponential backoff
- severidade: informativo
- categoria: outbox
- status: confirmado
- resumo: O PrismaOutboxRepository implementa claimPending com transicao atomica PENDING->PROCESSING, exponential backoff (10s, 40s, 90s, 160s), e move para FAILED apos 5 tentativas. O outbox-processor.ts processa em batches de 50.

#### Evidencia
- arquivo_ou_area: packages/db/src/outbox/prisma-outbox-repository.ts, apps/worker/src/processors/outbox-processor.ts
- detalhe: claimPending: findMany(PENDING) -> updateMany(PROCESSING) -> findMany(PROCESSING). Backoff: Math.pow(attempts, 2) * 10000.

#### Impacto
- tecnico: Eventos nao se perdem em falhas transitorias.
- negocio: Processamento confiavel de eventos de negocio.

#### Recomendacao
- acao_sugerida: Nenhuma.
- prioridade: nenhuma

---

### ACH-CR-003
- titulo: DLQ pipeline completo (scanner + processor)
- severidade: informativo
- categoria: dead-letter-queue
- status: confirmado
- resumo: O dlq-scanner.ts varre eventos FAILED no outbox e os move para uma fila BullMQ dedicada (wbc:dlq). O dlq-processor.ts consome esses jobs e loga para revisao manual. Pipeline completo de tratamento de eventos mortos.

#### Evidencia
- arquivo_ou_area: apps/worker/src/processors/dlq-scanner.ts, apps/worker/src/processors/dlq-processor.ts
- detalhe: Scanner processa batches de 20, muda status para DLQ e enfileira no BullMQ. Processor loga com warn para revisao manual.

#### Impacto
- tecnico: Eventos que falharam apos 5 tentativas nao ficam em limbo.
- negocio: Operacoes podem revisar e reprocessar manualmente.

#### Recomendacao
- acao_sugerida: Considerar adicionar endpoint admin para retry de jobs DLQ.
- prioridade: baixa

---

### ACH-CR-004
- titulo: Graceful degradation em idempotencia e cache
- severidade: informativo
- categoria: resiliencia
- status: confirmado
- resumo: Tanto o idempotency-middleware quanto o cache helper implementam graceful degradation: se Redis estiver indisponivel, a operacao continua sem cache/idempotencia, logando o erro. A request nao falha.

#### Evidencia
- arquivo_ou_area: apps/api/src/trpc/idempotency-middleware.ts:11-14, apps/api/src/lib/cache.ts:18-20
- detalhe: Idempotency: `catch { return { isDuplicate: false }; }`. Cache: `catch { logger.warn(...); return null; }`.

#### Impacto
- tecnico: Redis down nao derruba toda a API.
- negocio: Servico continua funcionando em modo degradado.

#### Recomendacao
- acao_sugerida: Nenhuma.
- prioridade: nenhuma

---

### ACH-CR-005
- titulo: claimPending no outbox nao e verdadeiramente atomico
- severidade: baixo
- categoria: outbox
- status: confirmado
- resumo: O claimPending faz findMany + updateMany em duas operacoes separadas, nao em uma transacao. Em cenario de multiplos workers, dois workers podem fazer findMany do mesmo batch antes do updateMany executar, resultando em duplicacao de processamento.

#### Evidencia
- arquivo_ou_area: packages/db/src/outbox/prisma-outbox-repository.ts:36-59
- detalhe: findMany(PENDING) retorna IDs, depois updateMany(PROCESSING). Gap entre as duas queries.

#### Impacto
- tecnico: Com multiplos workers, possivel processamento duplicado de eventos. Mitigado se ha apenas um worker.
- negocio: Impacto baixo no cenario atual de single worker.

#### Recomendacao
- acao_sugerida: Usar $transaction ou raw SQL UPDATE...RETURNING para claim atomico quando escalar para multiplos workers.
- prioridade: baixa

---

### ACH-CR-006
- titulo: Sentry capture no middleware de erro
- severidade: informativo
- categoria: error-tracking
- status: confirmado
- resumo: O domainErrorMiddleware em trpc.ts faz Sentry.captureException(error) antes de mapear o erro para tRPC, garantindo que erros inesperados sao rastreados.

#### Evidencia
- arquivo_ou_area: apps/api/src/trpc/trpc.ts:51-61
- detalhe: `catch (error) { if (error instanceof TRPCError) throw error; Sentry.captureException(error); ... }`

#### Impacto
- tecnico: Erros nao mapeados sao capturados no Sentry.
- negocio: Visibilidade de problemas em producao.

#### Recomendacao
- acao_sugerida: Nenhuma.
- prioridade: nenhuma

---

### ACH-CR-007
- titulo: Servicos Docker com restart policy e healthchecks
- severidade: informativo
- categoria: resiliencia-infra
- status: confirmado
- resumo: Todos os servicos Docker usam `restart: unless-stopped`. Postgres e Redis possuem healthchecks nativos com interval/timeout/retries. Web e worker dependem de servicos healthy.

#### Evidencia
- arquivo_ou_area: docker-compose.prod.yml
- detalhe: Postgres: pg_isready (10s interval, 5 retries). Redis: redis-cli ping. Web e worker: depends_on condition: service_healthy.

#### Impacto
- tecnico: Servicos reiniciam automaticamente e respeitam ordem de startup.
- negocio: Maior uptime.

#### Recomendacao
- acao_sugerida: Nenhuma.
- prioridade: nenhuma
