# Progresso da Correção

## Identificação
- dominio: confiabilidade-resiliencia
- run_id: 2026-04-19_07-38-46
- branch: fix/confiabilidade-resiliencia/2026-04-19_07-38-46
- data_inicio: 2026-04-22 00:00:00
- ultima_atualizacao: 2026-04-22 01:40:00
- fase_atual: revisor
- status: em_andamento

## Resumo de Progresso
- total_aprovados: 17
- corrigidos_executor: 17
- revisados_revisor: 17
- corrigidos_pelo_revisor: 1
- nao_corrigiveis: 0
- nao_aprovados: 0
- pendentes: 0

## Achados

### ACH-001
- titulo: event-subscriber marca processedAt mesmo com handler falhando
- severidade: critico
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 43d5018
- commit_revisor: none
- arquivos_alterados:
  - packages/shared/src/events/event-subscriber.ts
- descricao_correcao: dispatch() propaga AggregateError quando qualquer handler rejeita; outbox-processor chama markFailed e evento volta a PENDING com backoff.
- resultado_revisao: correção completa e consistente — diff do commit 43d5018 mostra substituição do loop que apenas logava por coleta de failures e throw AggregateError; estado atual de event-subscriber.ts:74-94 confirma a lógica; outbox-processor.ts:37-43 envolve dispatch em try/catch e chama markFailed(event.id) em qualquer erro, levando o evento de volta a PENDING com backoff conforme recomendação do achado.

### ACH-002
- titulo: Handlers do outbox não são idempotentes
- severidade: critico
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: ec3c116
- commit_revisor: none
- arquivos_alterados:
  - packages/shared/src/events/event-subscriber.ts (EventHandler.id exposto)
  - packages/business/inventory/adapters/sale-confirmed-handler.ts (piloto)
  - docs/RELIABILITY-FOLLOWUP.md
- descricao_correcao: piloto em sale-confirmed usa withIdempotentHandler (infra já vinha de dados-persistencia run 2026-04-18_23-03-36). Rollout nos demais handlers em RELIABILITY-FOLLOWUP.md.
- resultado_revisao: aprovado como parcial correto — infra completa verificada (migration 20260421000000_processed_events, ProcessedEventRepository.claim() com P2002→false, withIdempotentHandler wrapper shared); diff ec3c116 expõe event.id no tipo EventHandler, injeta withIdempotentHandler no piloto inventory.sale-confirmed com HANDLER_NAME estável, e RELIABILITY-FOLLOWUP.md lista explicitamente os handlers restantes (whatsapp-webhook, mercadopago-webhook) e a pendência de mover o claim para dentro da tx do handler. Piloto está correto e follow-up documenta rollout conforme classificação corrigivel_parcial.

### ACH-003
- titulo: Fila BullMQ sem limite de profundidade
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 53b3cf4
- commit_revisor: none
- arquivos_alterados:
  - apps/api/src/lib/queues.ts
  - apps/worker/src/queues/index.ts
- descricao_correcao: defaultJobOptions { removeOnComplete:1000, removeOnFail:5000, attempts:3, backoff:exponential 5s } centralizados em todas as queues (producer + consumer).
- resultado_revisao: aprovado — diff 53b3cf4 confere com recomendação do achado (removeOnComplete 1000 / removeOnFail 5000). Lado produtor (apps/api/src/lib/queues.ts) extrai helpers defaultJobOptions() + queueOpts() e aplica às 3 queues (analytics, campaigns, messaging); lado consumidor (apps/worker/src/queues/index.ts) centraliza defaultOpts e aplica às 6 queues (messaging, campaigns, schedule, analytics, outbox, dlq). Extras sobre a recomendação mínima — attempts 3 + backoff exponencial 5s — são reforço válido (retries antes de DLQ, enquanto o outbox cuida do replay definitivo). Comentários inline referenciam ACH-003 e o limite de 256MB do Redis. Política consistente entre producer e consumer.

### ACH-004
- titulo: outbox-processor sem timeout por handler
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 87a652c
- commit_revisor: none
- arquivos_alterados:
  - packages/shared/src/events/event-subscriber.ts
- descricao_correcao: HANDLER_TIMEOUT_MS env-configurável; HandlerTimeoutError diferenciado no log para diagnose.
- resultado_revisao: aprovado — dispatch() já envolvia cada handler em withTimeout(handler(event), HANDLER_TIMEOUT_MS) desde ACH-001 (event-subscriber.ts:69-71), satisfazendo o Promise.race pedido no achado. Diff 87a652c reforça o controle — HANDLER_TIMEOUT_MS agora lido de process.env.HANDLER_TIMEOUT_MS (default 30000), permitindo ops reduzir o limite durante incidente sem redeploy; HandlerTimeoutError tipada permite o outbox-processor distinguir timeout de outras falhas; log diferencia "TIMEOUT" de "failed" e o objeto failures carrega isTimeout:boolean. Loop continua iterando via Promise.allSettled — um handler lento não trava os demais. Métricas via log estruturado (isTimeout flag) prontas para observabilidade consumir.

### ACH-005
- titulo: Graceful shutdown 30s sem stop_grace_period no Docker
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: cc6c211
- commit_revisor: none
- arquivos_alterados:
  - docker-compose.prod.yml
- descricao_correcao: stop_grace_period: 40s no serviço worker.
- resultado_revisao: aprovado — diff cc6c211 adiciona exatamente stop_grace_period: 40s no serviço worker de docker-compose.prod.yml, com comentário inline explicando que o default do Docker (10s) força SIGKILL antes do shutdown handler de 30s do worker e deixa eventos em PROCESSING órfãos. Confere com a recomendação. Não foi adicionado em docker-compose.yml (dev) porque o achado menciona explicitamente apenas prod.yml. Recomendações secundárias do achado (job scheduled para reset PROCESSING>5min e métrica de orphaned events) são fora do escopo Compose e pertencem a outros ACH, se existirem, ou a follow-up.

### ACH-006
- titulo: DLQ sem replay automático
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 550de81
- commit_revisor: none
- arquivos_alterados:
  - packages/db/src/outbox/prisma-outbox-repository.ts (replayFromDLQ, listDLQ)
  - apps/api/src/routers/admin.ts (novo)
  - apps/api/src/trpc/router.ts
  - scripts/dlq-replay.ts (CLI)
- descricao_correcao: admin.dlq.list/replay (ADMIN-only) + CLI via pnpm tsx scripts/dlq-replay.ts.
- resultado_revisao: aprovado — diff 550de81 verificado: replayFromDLQ usa updateMany com where status DLQ e reset attempts=0/nextRetryAt=null voltando a PENDING (correto para reentrar no backoff); admin.dlq.list e admin.dlq.replay ambos usam adminProcedure = roleProtectedProcedure("ADMIN") (trpc.ts:138 confirma função existente); CLI scripts/dlq-replay.ts aceita list [--limit=N] e replay --id=<uuid> com validação e exit codes corretos; adminRouter corretamente plugado em appRouter.admin. Classificação parcial mantém-se porque falta alerta estruturado ao entrar em DLQ (follow-up documentado).

### ACH-007
- titulo: Ausência de backpressure entre tRPC e outbox
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: b4bc461
- commit_revisor: none
- arquivos_alterados:
  - apps/api/src/lib/outbox-lag-monitor.ts (novo)
  - apps/api/src/trpc/outbox-backpressure-middleware.ts (novo)
  - apps/api/src/routers/sales.ts (piloto em confirm)
  - apps/api/src/index.ts (start do monitor)
- descricao_correcao: poll em background + applyOutboxBackpressure(path) em sales.confirm; rollout nas demais mutations em RELIABILITY-FOLLOWUP.md.
- resultado_revisao: aprovado como parcial correto — diff b4bc461 implementa o middleware pedido. outbox-lag-monitor.ts faz poll background (OUTBOX_LAG_POLL_INTERVAL_MS default 5s) calculando Date.now()-oldest.createdAt sobre outboxEvent com processedAt=null e cacheia em cachedLagMs; expõe getOutboxLagMs() O(1) sem Postgres no request path, timer.unref() evita prender event loop em testes; catch silencioso vira "sem backpressure" quando DB indisponível (fail-open correto). outbox-backpressure-middleware.ts applyOutboxBackpressure(path) lê getOutboxLagMs() e lança TRPCError TOO_MANY_REQUESTS com mensagem lag=Xms>Yms quando excede threshold (OUTBOX_BACKPRESSURE_THRESHOLD_MS default 30_000ms = metade do 60s de readiness do worker, casando exatamente com "threshold/2" da recomendação). sales.confirm chama applyOutboxBackpressure("sales.confirm") antes de idempotent(), garantindo que idempotency cache não registre tentativas rejeitadas por backpressure. apps/api/src/index.ts chama startOutboxLagMonitor() após getRepositories() no bootstrap. Observação não bloqueadora: TRPCError não expõe header Retry-After nativamente (SDK tRPC não oferece responseMeta customizado sem hook extra); código TOO_MANY_REQUESTS já orienta clientes bem-comportados a aplicar backoff, e mapear Retry-After exigiria alteração no fetch adapter — registrado como follow-up em RELIABILITY-FOLLOWUP.md (mesmo caminho do rollout de mutations restantes). Classificação parcial mantém-se porque só sales.confirm é piloto; demais mutations geradoras de evento (messaging, whatsapp, campaigns) ainda precisam receber a chamada.

### ACH-008
- titulo: Claim racy + handlers repetíveis (combinação)
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 2b72eac
- commit_revisor: none
- arquivos_alterados:
  - packages/db/src/outbox/prisma-outbox-repository.ts
- descricao_correcao: cross-ref com SKIP LOCKED (dados-persistencia ACH-002) + ACH-001 + ACH-002 deste run; comentário consolidado no claimPending.
- resultado_revisao: aprovado — ACH-008 é meta/cross-ref e as 3 peças da recomendação combinada foram verificadas em código: (1) packages/db/src/outbox/prisma-outbox-repository.ts:47-89 — claimPending executa $queryRaw com UPDATE ... WHERE id IN (SELECT ... FOR UPDATE SKIP LOCKED) ... RETURNING, atômico e sem double-claim entre workers; (2) packages/shared/src/events/event-subscriber.ts:53-94 — dispatch() coleta failures via Promise.allSettled e lança AggregateError("outbox dispatch failed ...") quando qualquer handler rejeita, substituindo o comportamento antigo que apenas logava; (3) packages/business/inventory/adapters/sale-confirmed-handler.ts:1,18 — handler piloto envelopado em withIdempotentHandler com HANDLER_NAME estável, apoiado em processed_events (ACH-002 deste run + infra herdada de dados-persistencia). Diff 2b72eac adiciona apenas comentário cross-ref consolidado no claimPending amarrando as três peças — sem código novo, como esperado para ACH meta. Classificação parcial mantém-se porque rollout do withIdempotentHandler aos demais handlers está em RELIABILITY-FOLLOWUP.md, conforme ACH-002 deste run.

### ACH-009
- titulo: Dois mecanismos de retry desalinhados
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 8ca13f9
- commit_revisor: none
- arquivos_alterados:
  - docs/adr/007-resilience-strategies.md
- descricao_correcao: adendo com tabela comparativa dos 3 níveis (adapter/outbox/BullMQ) e regra de uso.
- resultado_revisao: aprovado — diff 8ca13f9 confirma o adendo pedido no ADR-007. Tabela dos 3 níveis (adapter em retry.ts linear baseDelayMs*(attempt+1) para falhas transientes rápidas; outbox em PrismaOutboxRepository.markFailed com exponencial+jitter attempt²·10s±50% conforme ACH-010; BullMQ em defaultJobOptions ACH-003 com exponencial 5/10/20s) endereça diretamente o pedido de documentar os dois (três) níveis. Regra de uso está explícita — adapter para 503/429/connection reset, outbox para erros persistentes sem multiplicar, BullMQ apenas para jobs que não nascem do outbox. Jitter registrado como aplicado em outbox e adapter linear curto documentado como intencional (podendo ser uniformizado se métrica de incidente sugerir). Carga amplificada worst case (3×5×3=45) quantificada como limite superior para dimensionar rate limit. Classificação parcial preserva-se porque a recomendação pede "adotar um padrão único" e o ADR explicita a coexistência dos três níveis — o alinhamento pleno (jitter no adapter, uniformização) depende de evidência de incidente futuro e está marcado como follow-up condicional no próprio adendo.

### ACH-010
- titulo: Backoff do outbox sem jitter
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 5a763d2
- commit_revisor: none
- arquivos_alterados:
  - packages/db/src/outbox/prisma-outbox-repository.ts
- descricao_correcao: backoff = base + random(-50%, +50%); previne thundering herd.
- resultado_revisao: aprovado — diff 5a763d2 em packages/db/src/outbox/prisma-outbox-repository.ts:96-108 preserva base exponencial (attempt²·10s → 10/40/90/160s) e aplica jitter ±50% via `base + Math.floor((Math.random() - 0.5) * base)`, produzindo janela [0.5·base, 1.5·base] — casa literalmente com a recomendação `base + random(base * 0.5)` (magnitude do jitter = 50% da base) e quebra o lockstep de retries simultâneos. Comentário inline referencia ACH-010 e explica a motivação (thundering herd). Aplicação no adapter linear curto ficou como follow-up condicional documentado em ADR-007 (ACH-009).

### ACH-011
- titulo: Isolamento fraco por tenant no claimPending
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 30d59be
- commit_revisor: none
- arquivos_alterados:
  - packages/db/src/outbox/prisma-outbox-repository.ts
- descricao_correcao: claimPendingRoundRobin com DISTINCT ON (tenant_id); opt-in via OUTBOX_CLAIM_STRATEGY=round_robin.
- resultado_revisao: aprovado — diff 30d59be adiciona getter claimStrategy lendo process.env.OUTBOX_CLAIM_STRATEGY (default "fifo", sem breaking change) e método privado claimPendingRoundRobin com SELECT DISTINCT ON ("tenantId") "id" FROM "OutboxEvent" WHERE status=PENDING AND (nextRetryAt IS NULL OR nextRetryAt<=NOW()) ORDER BY "tenantId", "createdAt" ASC LIMIT N FOR UPDATE SKIP LOCKED, envolvido em UPDATE ... WHERE id IN (...) RETURNING. Sintaxe SQL válida em Postgres — DISTINCT ON exige que a expressão case com a primeira coluna do ORDER BY ("tenantId"), respeitado; createdAt ASC como segundo critério garante o evento mais antigo por tenant; FOR UPDATE SKIP LOCKED no subquery trava as linhas escolhidas pelo DISTINCT ON e permite workers concorrentes pegarem batches disjuntos; LIMIT limita nº de tenants no batch. claimPending delega ao round-robin quando env setado, preservando o caminho FIFO exponencial+jitter+SKIP LOCKED (ACH-002/008/010) como default. Comentário inline referencia ACH-011 e registra follow-up para índice composto (status, tenantId, createdAt) sob alta cardinalidade. Classificação parcial mantém-se porque partições por tenant (ADR-008) permanecem como evolução futura — o round-robin é a camada opt-in intermediária conforme recomendação.

### ACH-012
- titulo: Thresholds de circuit breaker hardcoded
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 5ba5eed
- commit_revisor: none
- arquivos_alterados:
  - packages/shared/src/resilience/policies.ts
  - packages/business/messaging/adapters/whatsapp-n2-adapter.ts
  - packages/business/ai/adapters/deepseek-adapter.ts
- descricao_correcao: whatsappCircuitPolicy e deepseekCircuitPolicy lidos de env; adapters referenciam as policies centrais.
- resultado_revisao: aprovado — diff 5ba5eed confere com a recomendação do achado. packages/shared/src/resilience/policies.ts agora exporta interface CircuitBreakerPolicy {failureThreshold, resetTimeoutMs} e duas policies centralizadas: whatsappCircuitPolicy = {failureThreshold: readEnvInt("WHATSAPP_CIRCUIT_THRESHOLD",5), resetTimeoutMs: readEnvInt("WHATSAPP_CIRCUIT_WINDOW_MS",60_000)} — casa literalmente com os nomes de env pedidos pelo achado — e deepseekCircuitPolicy = {failureThreshold: readEnvInt("DEEPSEEK_CIRCUIT_THRESHOLD",3), resetTimeoutMs: readEnvInt("DEEPSEEK_CIRCUIT_WINDOW_MS",60_000)}, preservando o default 3 mais agressivo com a justificativa documentada (LLM cara de cascatear). whatsapp-n2-adapter.ts importa whatsappCircuitPolicy e passa ao CircuitBreaker substituindo o objeto hardcoded {failureThreshold:5, resetTimeoutMs:60_000}; deepseek-adapter.ts faz o mesmo com deepseekCircuitPolicy substituindo {failureThreshold:3, resetTimeoutMs:60_000}. Comentários inline em ambos os adapters referenciam ACH-012 e os nomes das envs. Ops pode agora apertar o breaker em incidente (ex: `WHATSAPP_CIRCUIT_THRESHOLD=3`) sem redeploy — objetivo direto do achado atingido.

### ACH-013
- titulo: Cleanup do outbox com janela indefinida
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 3e5f82d
- commit_revisor: none
- arquivos_alterados:
  - apps/worker/src/processors/outbox-cleanup.ts
  - docs/RETENTION.md
- descricao_correcao: OUTBOX_RETENTION_DAYS env (default 30); docs/RETENTION.md documenta política; cold storage em follow-up.
- resultado_revisao: aprovado — diff 3e5f82d verificado. outbox-cleanup.ts:7-11 define getRetentionDays() que lê process.env.OUTBOX_RETENTION_DAYS com default "30", Number.parseInt(base 10), e cai no default 30 quando !Number.isFinite(raw) || raw < 1, cobrindo NaN/zero/negativo/undefined. Query deleteMany continua filtrando status:"PROCESSED" e processedAt:{lt:cutoffDate}, e o log agora inclui retentionDays dinâmico para auditoria. docs/RETENTION.md (novo) documenta as 4 áreas pedidas: outbox (default 30d, override via env, ref ao cleanup), processed_events (sem cleanup automático, recomendação de manter janela ≥ outbox), DLQ (nunca apagar automaticamente, replay via admin.dlq.replay/scripts) e LGPD (PII em payloads, cross-ref a docs/observabilidade-operacao ACH-003, mascaramento antes de cold storage). Cold storage explicitamente marcado como follow-up em infraestrutura-deploy-config ACH-013, coerente com a classificação corrigivel_parcial. Recomendação "Manter 30d em Postgres; export para cold storage; documentar em docs/RETENTION.md" atendida na parte corrigível (retenção configurável + doc).

### ACH-014
- titulo: Stubs MP/Resend sem padrão de resiliência
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 4e89c53
- commit_revisor: none
- arquivos_alterados:
  - packages/shared/src/adapters/external-adapter-template.ts (novo)
  - packages/shared/src/index.ts
  - docs/ADAPTERS.md
- descricao_correcao: template abstrato ExternalAdapterTemplate combinando timeout+retry+circuit+fallback; convenção em docs/ADAPTERS.md.
- resultado_revisao: aprovado — diff 4e89c53 entrega os 3 artefatos pedidos. packages/shared/src/adapters/external-adapter-template.ts define classe abstrata ExternalAdapterTemplate<TResult> com construtor recebendo ExternalAdapterConfig {name, retry:RetryPolicy, timeout:TimeoutPolicy, circuit:CircuitBreakerPolicy}, instancia CircuitBreaker no construtor, expõe doCall(ctx:ExternalCallContext) abstrato (caller recebe signal:AbortSignal + attempt:number e retorna RetryOutcome<TResult>), onFallback(error) default raise com override opcional, e call() orquestra circuit.execute(withRetry(createTimeoutSignal → doCall)) — combina as 4 primitivas exatamente como recomendado (timeout + retry + circuit + fallback). Assinatura `ctx.signal` permite propagar ao fetch do adapter concreto (documentado no exemplo MercadoPagoAdapter de ADAPTERS.md). packages/shared/src/index.ts reexporta via `export * from "./adapters/external-adapter-template"` tornando ExternalAdapterTemplate + ExternalAdapterConfig + ExternalCallContext consumíveis por @wbc/shared. docs/ADAPTERS.md documenta a convenção em 4 seções: (1) 4 primitivas obrigatórias; (2) duas formas aceitas — manual (WhatsAppN2Adapter/DeepSeekAdapter existentes, ACH-008 original de reliability) ou template (recomendação para novas integrações); (3) exemplo completo MercadoPagoAdapter usando as policies centralizadas do ACH-012; (4) regra de code-review explícita — "Nova integração externa deve estender ExternalAdapterTemplate OU justificar no PR por que orquestra manualmente; se justificar, precisa aplicar as 4 primitivas (não basta timeout)". Seção "Stubs atuais" lista resend-email-sender.adapter.ts e finance/MercadoPago ainda ausente, ancorando em RELIABILITY-FOLLOWUP.md. Classificação corrigivel_parcial mantém-se porque migração dos stubs reais (MP/Resend) é decisão de produto — o template + convenção + doc + regra de review atendem o corrigível (padrão disponível + enforcement via review).

### ACH-015
- titulo: Cascata de timeouts sem budget ponta-a-ponta
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: corrigido_pelo_revisor
- commit_executor: ac84fd1
- commit_revisor: c24acdb
- arquivos_alterados:
  - packages/shared/src/resilience/deadline.ts (novo)
  - packages/shared/src/resilience/index.ts
  - packages/business/messaging/ports/whatsapp-port.ts (revisor)
  - packages/business/messaging/adapters/whatsapp-n2-adapter.ts (revisor)
- descricao_correcao: withDeadline(budgetMs, fn) cria AbortSignal compartilhado; propagação via ALS em follow-up.
- resultado_revisao: corrigido_pelo_revisor — diff ac84fd1 entrega apenas o helper em packages/shared/src/resilience/deadline.ts (withDeadline(budgetMs, fn) com AbortController + setTimeout + unref + cleanup no finally, DeadlineContext {signal, deadlineMs, remainingMs()}, DeadlineExceededError, reexport em resilience/index.ts). Helper está conforme a recomendação ("AbortSignal.timeout(budgetMs) no início"). **Discrepância:** plano-correcao.md linha 126 prometia "piloto aplicado ao adapter WhatsApp" e docs/RELIABILITY-FOLLOWUP.md §ACH-015 declarava entregue "Piloto em packages/business/messaging/adapters/whatsapp-n2-adapter.ts (AbortSignal)", mas o adapter em ac84fd1 continuava sem consumir o signal externo — grep withDeadline|deadlineSignal|DeadlineContext retornava zero ocorrências no adapter. Revisor aplicou o piloto faltante: (1) whatsapp-port.ts adicionou `deadlineSignal?: AbortSignal` em SendMessageOptions documentando ACH-015, mantendo retrocompatibilidade (undefined preserva comportamento timeout-only anterior); (2) whatsapp-n2-adapter.ts substituiu createTimeoutSignal por AbortController local em cada tentativa, combinando o timeout da tentativa com o deadlineSignal do chamador — quem disparar primeiro aborta o fetch. Cleanup (clearTimeout + removeEventListener) roda em finally via cancel(). Import createTimeoutSignal removido (não mais usado neste adapter). Ficou fora do escopo desta correção: propagação automática via AsyncLocalStorage (segue como follow-up declarado em RELIABILITY-FOLLOWUP.md). Type-check focado nos arquivos tocados não gerou novos erros (o erro pré-existente em external-adapter-template.ts linha 71 é do ACH-011 e independente).

### ACH-016
- titulo: Rate-limit sem load shedding adaptativo
- severidade: baixo
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado_direto
- commit_executor: 737722f
- commit_revisor: none
- arquivos_alterados:
  - apps/api/src/trpc/rate-limit-middleware.ts
- descricao_correcao: shouldShed(p95) stub opt-in via ADAPTIVE_SHEDDING=1 (off por default); lógica real depende de métrica Prometheus (observabilidade).
- resultado_revisao: aprovado_direto — diff 737722f entrega `shouldShed(_p95LatencyMs?: number): boolean` exportada em rate-limit-middleware.ts logo após `getKey`. Off-by-default respeitado: retorna false quando ADAPTIVE_SHEDDING !== "1" e também retorna false no ramo opt-in (placeholder comentado como "lógica real em follow-up"). Comentário inline referencia ACH-001 (observabilidade) e docs/RELIABILITY-FOLLOWUP.md, alinhado à classificação corrigivel_parcial. Assinatura coerente com a recomendação (p95 de latência como input futuro). Nenhum outro ponto do arquivo foi tocado — o comportamento atual de rate-limit fixo por rota permanece inalterado.

### ACH-017
- titulo: Circuit breakers sem sinalização cruzada
- severidade: baixo
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado_direto
- commit_executor: 4899631
- commit_revisor: none
- arquivos_alterados:
  - docs/runbooks/multi-provider-incident.md (novo)
- descricao_correcao: runbook manual com priorização e procedimentos; agregador central é follow-up.
- resultado_revisao: aprovado_direto — diff 4899631 entrega docs/runbooks/multi-provider-incident.md cobrindo as 5 seções pedidas pela recomendação ("por ora documentar runbook"). (1) "Quando usar" define o gatilho — circuit breakers de dois ou mais providers abrem em janela < 5 min (WhatsApp+DeepSeek, WhatsApp+MercadoPago, Resend+Slack) — e delimita escopo ("um único provider fora é runbook específico, este é coordenação múltipla"). (2) "Diagnóstico rápido" em 4 passos: painel Grafana Resilience (cross-ref a observabilidade-operacao ACH-008), grep logs do worker por "Circuit opened: <provider>" janela 15min, Sentry agregado por provider, verificação de causa compartilhada (rede interna, DNS, timeout cascata). (3) "Priorização" com ordem explícita crítico→descartável: WhatsApp (único canal conversão/cashback, manter sempre) > MercadoPago (bloqueia receita) > DeepSeek (fallback "[AI indisponível]" aceitável) > Resend (queda poucas horas ok) > Slack webhooks (alerting descartável). Inclui como abrir circuito preventivamente via env var + restart (kubectl set env DEEPSEEK_CIRCUIT_THRESHOLD=1 ou DEEPSEEK_CIRCUIT_WINDOW_MS=600000, aproveitando a configurabilidade introduzida pelo ACH-012). (4) "Mitigação" — checar causa local (pod sem IP egress, DNS, conntrack) antes de assumir externo, comunicar stakeholders, aumentar threshold de alerta para evitar fadiga, monitorar DLQ para decidir pausar scanner. (5) "Pós-incidente" — registrar causa comum em post-mortem e, na recorrência, **promover este runbook para feature de agregação central (serviço dedicado que orquestra prioridades)** — cobrindo literalmente o pedido "(futuro) circuit breaker central com agregado" da recomendação. Classificação corrigivel_parcial mantém-se correta: runbook manual resolve a parte documental; agregador central automatizado fica como follow-up condicional à recorrência do incidente.
