# Relatório de Correção

## Identificação
- dominio: apis-integracoes
- run_id: 2026-04-18_22-30-59
- branch: fix/apis-integracoes/2026-04-18_22-30-59
- data_inicio: 2026-04-20 22:30:00
- data_conclusao: 2026-04-21 00:20:00
- ultima_atualizacao: 2026-04-21 00:20:00
- status: concluido

## Resumo Executivo
20/20 achados processados. 19 aprovados pelo Revisor sem alteração; 1 (ACH-001) recebeu correção adicional do Revisor (canonicaliser recursivo para `deriveIdempotencyKey` — o 2º argumento de `JSON.stringify` como allow-list filtrava chaves aninhadas e colapsava payloads distintos no mesmo hash). Type-check e build passaram após 1 tentativa de correção pós-Revisor (schema de pagination não podia ser `ZodEffects` por causa de `.extend()` em filhos; WhatsAppSendResponseSchema realocado de `packages/business` para `@wbc/shared` porque `business/*` não tem package.json declarando zod).

## Estatísticas
- total_achados_na_run: 20
- aprovados_para_correcao: 20
- corrigidos_pelo_executor: 20
- aprovados_pelo_revisor_sem_alteracao: 19
- corrigidos_pelo_revisor: 1
- falha_executor_resolvida_pelo_revisor: 0
- nao_corrigiveis: 0
- nao_aprovados: 0
- falha_total: 0
- taxa_de_acerto_do_executor: 95%

## Validação Técnica
- type_check: passou
- build: passou
- tentativas_de_correcao_build: 1
- bloqueio_build: nao
- erro_persistente: nenhum

## Achados Corrigidos (Executor acertou de primeira)
- ACH-017 (medio) — event-publisher falha hard se OutboxPort não inicializado
- ACH-013 (medio) — Mapper domain → TRPCError incompleto
- ACH-018 (medio) — Paginação permite page arbitrariamente alto
- ACH-015 (alto) — Integrações externas sem timeout/retry consistentes
- ACH-011 (alto) — Outbox sem schema Zod por tipo de evento
- ACH-012 (medio) — Payloads de job BullMQ sem schema Zod
- ACH-019 (medio) — Adapters não validam shape de respostas externas
- ACH-016 (alto) — Idempotência outbound ausente em WhatsApp/Email
- ACH-003 (alto) — Webhooks inbound — MP sem handler e WhatsApp sem rota HTTP
- ACH-004 (alto) — Webhook WhatsApp sem proteção contra replay
- ACH-006 (alto) — Response shape heterogêneo
- ACH-007 (medio) — Paginação sem metadata
- ACH-010 (medio) — Datas/timestamps sem contrato explícito
- ACH-008 (medio) — Schemas Zod não totalmente centralizados
- ACH-009 (baixo) — Filtros/ordenação sem convenção
- ACH-002 (critico) — Sem versionamento de API
- ACH-005 (alto) — Deprecation path ausente
- ACH-014 (medio) — Sem OpenAPI/contrato externo
- ACH-020 (medio) — DLQ consumer apenas loga

## Achados Corrigidos com Intervenção do Revisor
- ACH-001 (critico) — Idempotência é opcional
  - discrepancia: `deriveIdempotencyKey` usava `JSON.stringify(input, Object.keys(input).sort())`. O 2º argumento do `JSON.stringify` como array é **allow-list aplicada em todos os níveis de nesting**, não só top-level. Resultado: `items: [{productName, quantity, unitCost}]` serializava como `items: [{}]` e dois pedidos com items completamente diferentes hashavam para a mesma chave, causando dedup silencioso de trabalho real.
  - correcao_revisor (commit 8918ab6): substituído por `canonicaliseForHash` recursivo que ordena chaves por nível, preserva arrays posicionalmente e lida com primitives/null/arrays/objetos aninhados.

## Achados Parciais (requerem validação humana)
- ACH-001 — migração das ~25 mutations restantes (auth/catalog/team/schedule/finance) para `idempotentRoute`; flip warn → hard-reject quando coverage completa
- ACH-002 — acordo formal com mobile team sobre `MIN_MOBILE_VERSION`; escrever API changelog
- ACH-003 — configurar secrets reais (`WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`, `MERCADOPAGO_WEBHOOK_SECRET`); testar end-to-end com providers; escrever use-cases de payment-sync e message-status-sync; adicionar `ioredis` em `apps/web/package.json` (hoje funciona via pnpm hoist + graceful degradation)
- ACH-005 — integrar `scripts/check-deprecated-fields.mjs` em CI; walker para procedures do AppRouter; parse de JSDoc `@deprecated`; CLI replay (`audkit-dlq replay`)
- ACH-006 — migrar cada router para helpers `ok()/fail()/itemOk()/listOk()`; a sementar coverage em 3 routers (clients/sales/campaigns) já em ACH-007
- ACH-008 — migrar 10 routers restantes (catalog/campaigns/schedule/landing/platform/logistics/team/finance/ai/sales) para `@wbc/validators`; flipar ESLint rule de warn → error
- ACH-009 — migrar 6 routers com filtros ad-hoc para convenção `filters`/`sort`
- ACH-011 — seed dos ~37 event types restantes; flip validação warn → hard-reject no publisher
- ACH-012 — seed de novos job types; flip validação warn → hard-reject
- ACH-014 — avaliar adoção de `trpc-openapi` quando primeiro parceiro externo precisar de REST
- ACH-020 — CLI replay (`audkit-dlq replay <id>`), painel Grafana DLQ-by-queue, Alertmanager rule; configurar `SENTRY_DSN`/`SLACK_WEBHOOK_URL` em produção

## Achados Não Corrigíveis
Nenhum.

## Achados Não Aprovados pelo Usuário
Nenhum.

## Achados com Falha Total
Nenhum.

## Commits Gerados

### Inicialização (1)
- 398512b — chore(auditoria): inicializar correção da run 2026-04-18_22-30-59 do domínio apis-integracoes

### Fase Executor (20 achados em 19 commits — ACH-003 e ACH-004 combinados)
- 66ac509 — fix(auditoria): ACH-017 — event-publisher com bootstrap check e health.ready
- e50f0ec — fix(auditoria): ACH-013 — mapear AILimitExceededError/AIProviderUnavailableError
- 7345f4a — fix(auditoria): ACH-018 — cap page e page*limit em paginationSchema
- 3f59478 — fix(auditoria): ACH-015 — fetchWithTimeout unificado em @wbc/shared
- 40fa417 — fix(auditoria): ACH-011 — event schemas registry e validação warn-only
- 4c14b08 — fix(auditoria): ACH-012 — job schemas registry com enqueueJob e validação warn-only
- 9b0fc03 — fix(auditoria): ACH-019 — Zod parse na response do WhatsApp N2
- d2d0e1c — fix(auditoria): ACH-016 — idempotency-key outbound (WhatsApp X-Request-Id e Resend Idempotency-Key)
- b451a86 — fix(auditoria): ACH-001 — idempotentRoute helper e aplicação nas mutations críticas
- c4229be — fix(auditoria): ACH-003/ACH-004 — rotas Next.js de webhooks inbound com replay protection
- 78868e8 — fix(auditoria): ACH-006 — helpers canônicos ok/fail/itemOk/listOk e doc de envelope
- 841c660 — fix(auditoria): ACH-007 — pagination envelope em clients/sales/campaigns list
- 58bff42 — fix(auditoria): ACH-010 — expose wireFormat em health.version
- 590a7c8 — fix(auditoria): ACH-008 — migrar inventory/analytics/messaging para @wbc/validators
- b2d47ff — fix(auditoria): ACH-009 — documentar convenção filters/sort para list endpoints
- 47ba4c3 — fix(auditoria): ACH-002 — política semver, supportedMobileVersions e doc de versioning
- bd92887 — fix(auditoria): ACH-005 — deprecation policy + script check-deprecated-fields
- 79c86a9 — fix(auditoria): ACH-014 — generator JSON Schema e doc comparativo trpc-openapi vs zod-to-json-schema
- ab26f68 — fix(auditoria): ACH-020 — DLQ com log estruturado e ganchos opcionais Sentry/Slack

### Transição (1)
- a5b7cc5 — chore(auditoria): fase executor concluída — transição para revisor

### Fase Revisor (1 review-fix)
- 8918ab6 — review-fix(auditoria): ACH-001 — canonicaliser recursivo para deriveIdempotencyKey

### Pós-validação (1)
- b6ebe89 — fix(auditoria): corrigir erro de type-check pós-correção

Total: 23 commits.

## Merge
- status_merge: pendente
- branch_origem: fix/apis-integracoes/2026-04-18_22-30-59
- branch_destino: main
- aprovado_por_usuario: nao
