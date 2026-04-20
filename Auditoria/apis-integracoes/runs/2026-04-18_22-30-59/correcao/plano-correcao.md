# Plano de Correção

## Identificação
- dominio: apis-integracoes
- run_id: 2026-04-18_22-30-59
- data_geracao: 2026-04-20 22:30:00
- total_achados: 20
- corrigiveis: 11
- corrigiveis_parciais: 9
- nao_corrigiveis: 0

## Ordem de Execução

### 1. ACH-017 — event-publisher falha hard se OutboxPort não inicializado
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: packages/shared/src/events/event-publisher.ts; apps/api/src/routers/health.ts; apps/api/src/bootstrap.ts (se existir)
- acao_planejada: Adicionar `isOutboxReady()` em event-publisher; `bootstrap()` valida no startup; `health.ready` expõe flag.
- dependencias: nenhuma
- justificativa_ordem: isolado, base para melhorias de robustez.
- risco_da_correcao: baixo; pode exigir wiring no startup do worker também.

### 2. ACH-013 — mapper domain → TRPCError incompleto
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: apps/api/src/trpc/error-handler.ts
- acao_planejada: Adicionar AIProviderUnavailableError → SERVICE_UNAVAILABLE; AILimitExceededError → TOO_MANY_REQUESTS.
- dependencias: nenhuma
- justificativa_ordem: complemento de correção anterior (codigo-manutenibilidade/ACH-018).
- risco_da_correcao: mínimo.

### 3. ACH-018 — paginação permite page arbitrariamente alto
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: packages/validators/src/common.ts
- acao_planejada: `page.max(1000)` e `.refine(p*l <= 100_000)`.
- dependencias: nenhuma
- justificativa_ordem: schema central que precede mudanças downstream.
- risco_da_correcao: baixo; pode quebrar chamadas com page absurdamente alto (não esperado em produção).

### 4. ACH-015 — integrações externas sem timeout/retry consistentes
- severidade: alto
- classificacao: corrigivel
- arquivo_ou_area_afetada: packages/shared/src/http/client.ts (novo); packages/business/messaging/adapters/*; packages/business/ai/adapters/*
- acao_planejada: Criar `fetchWithTimeout(url, init, {timeoutMs, retry})` + export em `@wbc/shared`. Adapters restantes (resend, outros) passam a usar.
- dependencias: nenhuma
- justificativa_ordem: precondição para ACH-016 e ACH-019.
- risco_da_correcao: médio — envolve adapters externos; manter defaults conservadores.

### 5. ACH-011 — outbox sem schema Zod por tipo de evento
- severidade: alto
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: packages/shared/src/events/schemas.ts (novo); packages/shared/src/events/event-publisher.ts; apps/worker/src/processors/outbox-processor.ts
- acao_planejada: Registrar `eventRegistry` com `z.discriminatedUnion('type', [...])`; validar no `publish()` e no consumer; sementar 2-3 eventos como exemplo e documentar migração.
- dependencias: nenhuma
- justificativa_ordem: contratos de eventos precedem consumer-side work.
- risco_da_correcao: médio — validar em publish pode quebrar eventos existentes; usaremos validação opcional (warn) durante migração com `docs/EVENT_SCHEMAS.md`.

### 6. ACH-012 — payloads de job BullMQ sem schema Zod
- severidade: medio
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: packages/shared/src/jobs/schemas.ts (novo); apps/api/src/lib/queues.ts; apps/worker/src/processors/*.ts
- acao_planejada: Definir schemas por fila (analytics/campaigns/messaging); wrapper `enqueue()` valida no producer; processors validam no consumer; documentar em `docs/JOBS.md`.
- dependencias: parcialmente do ACH-011 (padrão similar).
- justificativa_ordem: pareado com ACH-011.
- risco_da_correcao: médio — validação estrita pode rejeitar jobs existentes; começar com `safeParse` + log warn.

### 7. ACH-019 — adapters não validam shape de respostas externas
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: packages/business/messaging/adapters/whatsapp-n2-adapter.ts
- acao_planejada: `WhatsAppSendResponseSchema = z.object({ messages: z.array(z.object({id:z.string()})).min(1) })`; `parseAsync` antes de acessar.
- dependencias: nenhuma
- justificativa_ordem: proximidade com ACH-016.
- risco_da_correcao: baixo.

### 8. ACH-016 — idempotência outbound ao enviar WhatsApp/Email
- severidade: alto
- classificacao: corrigivel
- arquivo_ou_area_afetada: packages/business/messaging/adapters/whatsapp-n2-adapter.ts; adapter resend (se existir)
- acao_planejada: Gerar ULID `requestId` persistido por tentativa lógica; enviar em header `Idempotency-Key` (Resend) e `X-Request-Id` (WhatsApp); mesmo ID nos retries.
- dependencias: ACH-015 (helper http) opcionalmente; pode ser direto.
- justificativa_ordem: proximidade com ACH-019.
- risco_da_correcao: baixo; pode precisar passar `requestId` do callsite.

### 9. ACH-001 — idempotência obrigatória em mutations
- severidade: critico
- classificacao: corrigivel
- arquivo_ou_area_afetada: apps/api/src/trpc/idempotency-middleware.ts; apps/api/src/routers/{auth,campaigns,messaging,clients,catalog,inventory}.ts
- acao_planejada: Criar procedure wrapper `idempotentMutation` (força `idempotencyKey` no input via `z.intersection`); aplicar nas mutations `create|confirm|send|mark|accept|cancel` dos routers listados.
- dependencias: nenhuma
- justificativa_ordem: severidade crítica; aplicado após fundamentos estarem prontos.
- risco_da_correcao: médio — clientes que ainda não enviam key passarão a falhar. Mitigar: gerar key no middleware com hash estável se ausente (compatibilidade durante rollout); emite warn.

### 10. ACH-003 — Webhooks inbound sem rota nem handler MP
- severidade: alto
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: apps/web/app/api/webhooks/whatsapp/route.ts (novo); apps/web/app/api/webhooks/mercadopago/route.ts (novo); packages/business/payments/adapters/mercadopago-webhook-handler.ts (novo stub); docs/WEBHOOKS.md
- acao_planejada: Criar rotas Next.js App Router; WhatsApp usa handler existente; MP handler stub com verificação HMAC (secret via env).
- dependencias: nenhuma
- justificativa_ordem: requisito para ACH-004.
- risco_da_correcao: médio — rotas web precisam de teste manual; handler MP exige credenciais reais.

### 11. ACH-004 — replay protection no webhook WhatsApp
- severidade: alto
- classificacao: corrigivel
- arquivo_ou_area_afetada: packages/business/messaging/adapters/whatsapp-webhook-handler.ts
- acao_planejada: `verifyWebhookTimestamp(ts, {maxDriftSec: 300})` + `ensureNotReplayed(requestId, redis, ttlSec: 600)` com prefix `wh:wa:`.
- dependencias: ACH-003 (rota chama handler com ts e requestId)
- justificativa_ordem: complementa ACH-003.
- risco_da_correcao: baixo; exige Redis disponível.

### 12. ACH-006 — response shape heterogêneo
- severidade: alto
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: apps/api/src/trpc/responses.ts (novo); docs/API_RESPONSES.md
- acao_planejada: Helpers `ok(data)`, `fail(code)`, `listOk(data, meta)`; documentar formato canônico. Migração dos routers é follow-up e parte em ACH-007.
- dependencias: nenhuma
- justificativa_ordem: base para ACH-007 e ACH-010.
- risco_da_correcao: baixo; apenas utilitários + docs.

### 13. ACH-007 — paginação sem metadata
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: apps/api/src/routers/{clients,sales,campaigns,inventory}.ts; use-cases correspondentes
- acao_planejada: `list*` retornam `{data, meta:{page,limit,total,hasMore}}`; use-cases já consultam total (onde não consultar, adiciono `count`).
- dependencias: ACH-006 (helper `listOk`)
- justificativa_ordem: usa infraestrutura do ACH-006.
- risco_da_correcao: médio — breaking para UI; mas web ainda não existe em produção.

### 14. ACH-010 — datas/timestamps sem contrato explícito
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: apps/api/src/routers/health.ts; docs/API_RESPONSES.md
- acao_planejada: `health.version` passa a devolver `timezone: 'UTC'` (tenant timezone quando contexto disponível); doc registra "todas as datas ISO 8601 UTC".
- dependencias: ACH-006
- justificativa_ordem: pequeno ajuste a seguir.
- risco_da_correcao: mínimo.

### 15. ACH-008 — schemas Zod não totalmente centralizados
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: apps/api/src/routers/{schedule,sales,finance,catalog,campaigns,analytics,team,platform,messaging,landing,ai,logistics,inventory}.ts; packages/validators/src/*.ts
- acao_planejada: Migrar `z.object({...}).input` inline para schemas em `@wbc/validators`. 13 routers.
- dependencias: ESLint rule já existe como `warn`. Ao final, flipar para `error`.
- justificativa_ordem: grande e cross-cutting; aplicado após fundamentos.
- risco_da_correcao: médio — grande volume; cuidado com merge com os schemas já existentes.

### 16. ACH-009 — filtros e ordenação sem convenção
- severidade: baixo
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: docs/API_FILTERING.md
- acao_planejada: Documentar convenção `filters: {...}` + `sort: {by, order}`; migração de routers é follow-up.
- dependencias: nenhuma
- justificativa_ordem: baixa severidade; cabe em doc.
- risco_da_correcao: mínimo.

### 17. ACH-002 — sem versionamento de API
- severidade: critico
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: packages/shared/src/version.ts; apps/api/src/routers/health.ts; docs/VERSIONING.md
- acao_planejada: `health.version` retorna `apiVersion`, `minMobileVersion`, `supportedMobileVersions`. `docs/VERSIONING.md` define política semver.
- dependencias: ACH-006 (formato de resposta)
- justificativa_ordem: crítico, mas maior parte é doc + health.
- risco_da_correcao: baixo.

### 18. ACH-005 — deprecation path ausente
- severidade: alto
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: docs/API_DEPRECATION.md; scripts/check-deprecated-fields.mjs
- acao_planejada: Doc de política `@deprecated`; script Node que diff schema atual vs snapshot anterior e alerta campos removidos sem depreciação.
- dependencias: ACH-002
- justificativa_ordem: complementa ACH-002.
- risco_da_correcao: baixo; sem impacto runtime.

### 19. ACH-014 — sem OpenAPI/contrato externo
- severidade: medio
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: docs/API_SPEC.md; scripts/generate-api-schema.mjs
- acao_planejada: Doc avaliativo comparando `trpc-openapi` vs `zod-to-json-schema`; script exemplo gerando JSON Schema de 1 procedure.
- dependencias: nenhuma
- justificativa_ordem: documental.
- risco_da_correcao: mínimo.

### 20. ACH-020 — DLQ consumer apenas loga
- severidade: medio
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: apps/worker/src/processors/dlq-processor.ts; docs/DLQ_REPLAY.md
- acao_planejada: Log estruturado enriquecido (tenantId, eventType, attempts, lastError); ganchos opcionais `SENTRY_DSN`/`SLACK_WEBHOOK_URL` com fallback silencioso (sem credenciais). Doc de replay manual.
- dependencias: nenhuma
- justificativa_ordem: operacional; pode ser último.
- risco_da_correcao: baixo.

## Achados Não Corrigíveis
Nenhum.

## Resumo do Plano
- Total a corrigir: 11
- Total parcial (requer validação humana após correção): 9
- Total não corrigível: 0
- Estimativa de commits: 22 (20 fix + 1 inicialização + 1 relatório final; review-fixes adicionais se houver discrepância)
