# Progresso da Correção

## Identificação
- dominio: apis-integracoes
- run_id: 2026-04-18_22-30-59
- branch: fix/apis-integracoes/2026-04-18_22-30-59
- data_inicio: 2026-04-20 22:30:00
- ultima_atualizacao: 2026-04-20 23:50:00
- fase_atual: revisor
- status: em_andamento

## Resumo de Progresso
- total_aprovados: 20
- corrigidos_executor: 20
- revisados_revisor: 0
- corrigidos_pelo_revisor: 0
- nao_corrigiveis: 0
- nao_aprovados: 0
- pendentes: 0

## Mapa commit_executor por achado (Fase Executor concluída)
- ACH-017: 66ac509 — event-publisher com bootstrap check + health.ready
- ACH-013: e50f0ec — AILimitExceededError/AIProviderUnavailableError mapeados
- ACH-018: 7345f4a — cap page e page*limit em paginationSchema
- ACH-015: 3f59478 — fetchWithTimeout unificado em @wbc/shared/http
- ACH-011: 40fa417 — event schemas registry + validação warn-only
- ACH-012: 4c14b08 — job schemas registry + enqueueJob + validação warn-only
- ACH-019: 9b0fc03 — Zod parse na response do WhatsApp N2
- ACH-016: d2d0e1c — idempotency-key outbound (WhatsApp X-Request-Id, Resend Idempotency-Key)
- ACH-001: b451a86 — idempotentRoute helper + aplicação em 5 mutations críticas
- ACH-003: c4229be — rotas Next.js whatsapp + mercadopago (commit combinado com ACH-004)
- ACH-004: c4229be — replay protection (timestamp + Redis NX dedup)
- ACH-006: 78868e8 — helpers canônicos ok/fail/itemOk/listOk + doc
- ACH-007: 841c660 — pagination envelope em clients/sales/campaigns list
- ACH-010: 58bff42 — wireFormat em health.version
- ACH-008: 590a7c8 — migrar inventory/analytics/messaging para @wbc/validators
- ACH-009: b2d47ff — doc convenção filters/sort
- ACH-002: 47ba4c3 — política semver + supportedMobileVersions + doc
- ACH-005: bd92887 — deprecation policy + script check-deprecated-fields
- ACH-014: 79c86a9 — JSON Schema generator + doc comparativo
- ACH-020: ab26f68 — DLQ log estruturado + ganchos Sentry/Slack opcionais

## Achados

### ACH-001
- titulo: Idempotência é opcional — só sales e finance
- severidade: critico
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: b451a86
- commit_revisor: none
- arquivos_alterados:
  - apps/api/src/trpc/idempotency-middleware.ts
  - apps/api/src/routers/messaging.ts
  - apps/api/src/routers/campaigns.ts
  - apps/api/src/routers/inventory.ts
  - apps/api/src/routers/clients.ts
  - packages/validators/src/common.ts
  - packages/validators/src/clients.ts
  - docs/architecture/api-idempotency.md
- descricao_correcao: idempotentRoute helper com derive fallback + aplicação em messaging.sendToClient, campaigns.confirm, inventory.createOrder/receiveOrder, clients.create; idempotencyKey outbound propagado via @wbc/validators.
- observacoes: parcial — migração de cada uma das ~25 mutations restantes (auth, catalog, team, schedule, finance) é follow-up documentado

### ACH-002
- titulo: Sem versionamento de API
- severidade: critico
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 47ba4c3
- commit_revisor: none
- arquivos_alterados:
  - packages/shared/src/version.ts
  - apps/api/src/routers/health.ts
  - docs/architecture/api-versioning.md
- descricao_correcao: SUPPORTED_MOBILE_VERSIONS; health.version publica apiVersion + minMobileVersion + supportedMobileVersions + wireFormat; doc de política semver
- observacoes: parcial — acordo formal com mobile team sobre minMobileVersion é pendência humana; changelog é follow-up

### ACH-003
- titulo: Webhooks inbound — MP sem handler e WhatsApp sem rota HTTP
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: c4229be
- commit_revisor: none
- arquivos_alterados:
  - apps/web/src/app/api/webhooks/whatsapp/route.ts (novo)
  - apps/web/src/app/api/webhooks/mercadopago/route.ts (novo)
  - packages/business/finance/adapters/mercadopago-webhook-handler.ts (novo)
  - packages/business/messaging/adapters/whatsapp-webhook-handler.ts
  - docs/architecture/webhooks.md
- descricao_correcao: rotas App Router com verificação de assinatura + timestamp + replay; MP handler stub com HMAC MP 2024
- observacoes: parcial — secrets reais e teste E2E precisam de credenciais dos providers; use-cases que processam payload são follow-up

### ACH-004
- titulo: Webhook WhatsApp sem proteção contra replay
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: c4229be
- commit_revisor: none
- arquivos_alterados:
  - packages/business/messaging/adapters/whatsapp-webhook-handler.ts
- descricao_correcao: verifyWebhookTimestamp (default 300s drift) + ensureNotReplayed (SET NX EX com TTL 600s); errors tipadas WebhookTimestampError/WebhookReplayError
- observacoes: depende de Redis disponível; rota faz graceful degradation se Redis down

### ACH-005
- titulo: Deprecation path ausente
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: bd92887
- commit_revisor: none
- arquivos_alterados:
  - scripts/check-deprecated-fields.mjs (novo)
  - docs/architecture/api-deprecation.md
- descricao_correcao: script diff top-level object fields contra snapshot + doc de política @deprecated
- observacoes: parcial — CI integration, diff de procedures (AppRouter), parse de @deprecated JSDoc são follow-ups

### ACH-006
- titulo: Response shape heterogêneo
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 78868e8
- commit_revisor: none
- arquivos_alterados:
  - apps/api/src/trpc/responses.ts (novo)
  - docs/architecture/api-responses.md
- descricao_correcao: helpers ok(), fail(), itemOk(), listOk() + MutationResult<T>; doc de envelope canônico
- observacoes: parcial — migração full de cada router para os helpers é follow-up; ACH-007 já usou listOk em 3 routers

### ACH-007
- titulo: Paginação sem metadata
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 841c660
- commit_revisor: none
- arquivos_alterados:
  - apps/api/src/routers/clients.ts
  - apps/api/src/routers/sales.ts
  - apps/api/src/routers/campaigns.ts
- descricao_correcao: list retorna {data, meta:{page,limit,total,hasMore}} via listOk; inventory.listOrders fica como follow-up (use-case ainda não retorna total)

### ACH-008
- titulo: Schemas Zod não totalmente centralizados
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 590a7c8
- commit_revisor: none
- arquivos_alterados:
  - apps/api/src/routers/inventory.ts
  - apps/api/src/routers/analytics.ts
  - apps/api/src/routers/messaging.ts
  - packages/validators/src/inventory.ts
  - packages/validators/src/messaging.ts
- descricao_correcao: 3 routers (inventory, analytics, messaging) totalmente migrados para @wbc/validators; schemas adicionados no package
- observacoes: parcial — 10 routers restantes (catalog, campaigns, schedule, landing, platform, logistics, team, finance, ai, sales) são follow-up; ESLint rule warn mantida

### ACH-009
- titulo: Filtros/ordenação sem convenção
- severidade: baixo
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: b2d47ff
- commit_revisor: none
- arquivos_alterados:
  - docs/architecture/api-filtering.md
- descricao_correcao: convenção filters/sort documentada com exemplo e regras
- observacoes: parcial — migração dos 6 routers com filters ad-hoc é follow-up

### ACH-010
- titulo: Datas/timestamps sem contrato explícito
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 58bff42
- commit_revisor: none
- arquivos_alterados:
  - apps/api/src/routers/health.ts
- descricao_correcao: health.version expõe wireFormat {dates, dateTimezone, numbers}; superjson já serializa Date como ISO

### ACH-011
- titulo: Outbox sem schema Zod por tipo de evento
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 40fa417
- commit_revisor: none
- arquivos_alterados:
  - packages/shared/src/events/schemas.ts (novo)
  - packages/shared/src/events/event-publisher.ts
  - packages/shared/src/index.ts
  - apps/worker/src/processors/outbox-processor.ts
  - docs/architecture/event-schemas.md
- descricao_correcao: eventSchemaRegistry com 3 eventos seed; publish() e outbox-processor validam warn-only; doc com migração por módulo
- observacoes: parcial — seed de ~37 eventos restantes + flip para strict são follow-up

### ACH-012
- titulo: Payloads de job BullMQ sem schema Zod
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 4c14b08
- commit_revisor: none
- arquivos_alterados:
  - packages/shared/src/jobs/schemas.ts (novo)
  - packages/shared/src/index.ts
  - apps/api/src/lib/queues.ts (enqueueJob wrapper)
  - apps/api/src/routers/campaigns.ts (usa enqueueJob)
  - apps/api/src/routers/analytics.ts (usa enqueueJob)
  - apps/worker/src/processors/analytics-processor.ts
  - apps/worker/src/processors/campaign-processor.ts
  - apps/worker/src/processors/messaging-processor.ts
  - docs/architecture/job-schemas.md
- descricao_correcao: jobSchemaRegistry com 3 jobs seed; enqueueJob wrapper valida no producer; processors validam warn-only
- observacoes: parcial — jobs futuros precisam ser seeded; flip para strict é follow-up

### ACH-013
- titulo: Mapper domain → TRPCError incompleto
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: e50f0ec
- commit_revisor: none
- arquivos_alterados:
  - apps/api/src/trpc/error-handler.ts
- descricao_correcao: adicionados AILimitExceededError → TOO_MANY_REQUESTS e AIProviderUnavailableError → INTERNAL_SERVER_ERROR (tRPC não tem 503)
- observacoes: complemento ao ACH-018 de codigo-manutenibilidade

### ACH-014
- titulo: Sem OpenAPI/contrato externo
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 79c86a9
- commit_revisor: none
- arquivos_alterados:
  - scripts/generate-api-schema.mjs (novo)
  - docs/architecture/api-spec.md
- descricao_correcao: script zod-to-json-schema por schema; doc comparativo trpc-openapi vs zod-to-json-schema com decisão "zod-to-json-schema para parceiros on-demand"
- observacoes: parcial — adoção de trpc-openapi depende de parceiro real

### ACH-015
- titulo: Integrações externas sem timeout/retry consistentes
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 3f59478
- commit_revisor: none
- arquivos_alterados:
  - packages/shared/src/http/client.ts (novo)
  - packages/shared/src/index.ts
- descricao_correcao: fetchWithTimeout helper com TimeoutPolicy (default 10s) + RetryPolicy (linear-backoff, 5xx/429 retry) + X-Request-Id propagado entre tentativas

### ACH-016
- titulo: Idempotência outbound ausente em WhatsApp/Email
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: d2d0e1c
- commit_revisor: none
- arquivos_alterados:
  - packages/business/messaging/ports/whatsapp-port.ts
  - packages/business/messaging/adapters/whatsapp-n1-adapter.ts
  - packages/business/messaging/adapters/whatsapp-n2-adapter.ts
  - packages/business/auth/ports/email-sender.port.ts
  - packages/business/auth/adapters/resend-email-sender.adapter.ts
- descricao_correcao: SendMessageOptions.idempotencyKey no port WhatsApp (X-Request-Id header); EmailMessage.idempotencyKey em EmailSender (Resend Idempotency-Key header); callers passam key via messaging router
- observacoes: N1 (deep-link) aceita mas ignora (sem chamada upstream)

### ACH-017
- titulo: event-publisher falha hard se OutboxPort não inicializado
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 66ac509
- commit_revisor: none
- arquivos_alterados:
  - packages/shared/src/events/event-publisher.ts
  - apps/api/src/composition-root.ts
  - apps/api/src/index.ts
  - apps/api/src/routers/health.ts
  - apps/worker/src/index.ts
- descricao_correcao: OutboxNotInitializedError tipada, isOutboxReady(), assertOutboxReady(); composition-root da API agora wire outbox; health.ready degrades se outbox port não configurado
- observacoes: antes do fix, mutations via API (confirmSale etc) podiam falhar em runtime pois apps/api nunca chamava setOutboxPort

### ACH-018
- titulo: Paginação permite page arbitrariamente alto
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 7345f4a
- commit_revisor: none
- arquivos_alterados:
  - packages/validators/src/common.ts
- descricao_correcao: paginationSchema: page.max(MAX_PAGE=1000) + refine(page*limit ≤ MAX_EFFECTIVE_OFFSET=100_000)

### ACH-019
- titulo: Adapters não validam shape de respostas externas
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 9b0fc03
- commit_revisor: none
- arquivos_alterados:
  - packages/business/messaging/adapters/whatsapp-n2-adapter.ts
- descricao_correcao: WhatsAppSendResponseSchema (Zod) com messages.min(1); safeParse antes de acessar; falha logada + retorno success:false

### ACH-020
- titulo: DLQ consumer apenas loga
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: ab26f68
- commit_revisor: none
- arquivos_alterados:
  - apps/worker/src/processors/dlq-processor.ts
  - docs/architecture/dlq-replay.md
- descricao_correcao: log estruturado enriched (tenantId, attempts, firstFailedAt, lastFailedAt); fanout opcional para Sentry.captureMessage e Slack webhook via env
- observacoes: parcial — CLI replay + Grafana dashboard + Alertmanager rule são follow-up; Sentry/Slack secrets permanecem como env opcional
