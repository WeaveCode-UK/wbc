# Achados da Auditoria

## Identificação
- dominio: apis-integracoes
- run_id: 2026-04-18_22-30-59
- ultima_atualizacao: 2026-04-18 22:40:00

## Regras de Registro
- Registrar apenas achados reais com evidência observável.
- Não registrar opinião vaga sem base no repositório.
- Cada achado deve ter ID único dentro da run.
- Cada achado deve ter severidade definida.
- Se o item não for confirmado, registrar como hipótese com justificativa.

## Severidades Permitidas
- critico · alto · medio · baixo · informativo

## Status Permitidos
- aberto · confirmado · mitigado · resolvido · aceito · nao_aplicavel

## Achados Registrados

### ACH-001
- titulo: Idempotência é opcional — aplicada apenas em sales e finance; demais mutations vulneráveis a duplicidade
- severidade: critico
- categoria: idempotencia
- status: confirmado
- resumo: O wrapper `idempotent()` (TTL 24h no Redis) é aplicado em mutations de `sales.*` e `finance.*`. As demais mutations críticas (`auth.acceptInvite`, `campaigns.sendCampaign`, `messaging.send*`, `clients.create/update`, `catalog.*`, `inventory.*`) não usam a chave, então um retry de rede executa a mutation duas vezes.

#### Evidencia
- arquivo_ou_area: apps/api/src/routers/sales.ts:36-78; apps/api/src/routers/finance.ts:29-32; apps/api/src/routers/{auth,campaigns,messaging,clients,catalog,inventory}.ts (sem `idempotent()`); apps/api/src/trpc/idempotency-middleware.ts
- detalhe: Chave `idempotencyKey` só no input opcional em alguns procedures; não há enforcement no middleware

#### Impacto
- tecnico: Duplicidade em eventos, cobranças ou notificações em caso de retry do cliente
- negocio: Double-charge possível em MercadoPago quando integrado; dupla entrega de mensagens; dados duplicados

#### Recomendacao
- acao_sugerida: Obrigar `idempotencyKey` em todas as mutations do tipo `create`/`confirm`/`send`/`mark` via middleware; gerar key no cliente (ULID) quando ausente para queries críticas
- prioridade: alta

---

### ACH-002
- titulo: Sem versionamento de API nem estratégia de breaking-change
- severidade: critico
- categoria: versionamento
- status: confirmado
- resumo: Não existe prefixo `/v1/` nem header `wbc-api-version`. A constante `API_VERSION = '1.0.0'` aparece apenas em `health.version`. Consumer (apps/mobile) depende do tipo `AppRouter` gerado em build; uma mudança removendo campo em schema Zod quebra o build do cliente sem aviso.

#### Evidencia
- arquivo_ou_area: packages/shared/src/version.ts:1-3; apps/api/src/routers/health.ts:22-25; apps/api/src/trpc/router.ts (export type AppRouter)
- detalhe: Ausência de docs/VERSIONING.md e de deprecation path

#### Impacto
- tecnico: Impossível roll-out gradual; mobile antigo pode ficar broken silenciosamente após breaking change
- negocio: Usuários com app não atualizado deixam de operar; suporte sobrecarregado

#### Recomendacao
- acao_sugerida: Documentar política semver; nunca remover campo sem depreciar por 1 MAJOR; enviar `supportedMobileVersions` via `health.version`; mobile bloqueia startup se abaixo do mínimo
- prioridade: alta

---

### ACH-003
- titulo: Webhooks inbound — MercadoPago sem handler e WhatsApp sem rota HTTP declarada
- severidade: alto
- categoria: webhooks
- status: confirmado
- resumo: `whatsapp-webhook-handler.ts` implementa verificação HMAC, mas nenhuma rota `/api/webhooks/whatsapp` foi encontrada em apps/api ou apps/web. Além disso, o Prisma schema referencia `mercadopagoId`, mas não há adapter/handler para receber notificações de pagamento do MercadoPago.

#### Evidencia
- arquivo_ou_area: packages/business/messaging/adapters/whatsapp-webhook-handler.ts; ausência de rota HTTP montando o handler; ausência de adapter `mercadopago-webhook-handler.ts`
- detalhe: Inventário de webhooks inbound não está documentado em docs/

#### Impacto
- tecnico: Status updates do WhatsApp e confirmações de pagamento do MP não chegam ao sistema; sincronização precisa ser manual
- negocio: UX degradada (mensagens sem estado atualizado) e risco financeiro (pagamentos aprovados não refletidos em pedido)

#### Recomendacao
- acao_sugerida: Criar rota Next.js `/app/api/webhooks/{whatsapp,mercadopago}/route.ts`, aplicar verificação de assinatura antes de processar payload; documentar em `docs/WEBHOOKS.md`
- prioridade: alta

---

### ACH-004
- titulo: Webhook WhatsApp sem proteção contra replay (sem checagem de timestamp e sem cache de request-id)
- severidade: alto
- categoria: webhooks
- status: confirmado
- resumo: O handler valida apenas HMAC; não confronta `entry[0].changes[0].value.timestamp` com `now ± 300s` nem armazena `request-id` em Redis para deduplicação.

#### Evidencia
- arquivo_ou_area: packages/business/messaging/adapters/whatsapp-webhook-handler.ts (verifica apenas HMAC; não faz replay protection)
- detalhe: Meta documenta timestamp + request-id para idempotência; ausente

#### Impacto
- tecnico: Processa webhook duplicado ou antigo — pode duplicar eventos no outbox e reenviar notificações
- negocio: Duplicidade de mensagens/estados

#### Recomendacao
- acao_sugerida: Rejeitar webhooks com `|now - ts| > 300s`; gravar `sha256(request_id)` em Redis com TTL 10 min; rejeitar duplicados
- prioridade: alta

---

### ACH-005
- titulo: Tipo `AppRouter` exportado sem deprecation path — breaking change atinge web e mobile ao mesmo tempo
- severidade: alto
- categoria: compatibilidade
- status: confirmado
- resumo: Mobile e web consomem o tipo `AppRouter` exportado de `apps/api/src/trpc/router.ts`. Remover ou renomear campo de input/output quebra build/runtime imediatamente; não há deprecação marcada.

#### Evidencia
- arquivo_ou_area: apps/api/src/trpc/router.ts:19-36 (export type AppRouter)
- detalhe: Nenhuma marcação `@deprecated` em schemas; nenhuma policy documentada

#### Impacto
- tecnico: Sincronização rígida entre backend e clientes
- negocio: Mobile desatualizada deixa de funcionar

#### Recomendacao
- acao_sugerida: Política "nunca remover campo; marcar `@deprecated` e manter por ≥1 MAJOR"; expor campos deprecados via `health.version`; CI que emite warning quando um campo some do schema vs release anterior
- prioridade: alta

---

### ACH-006
- titulo: Response shape heterogêneo — ausência de envelope padronizado
- severidade: alto
- categoria: contrato-de-api
- status: confirmado
- resumo: Procedures retornam formatos inconsistentes: `{ success: true }`, objetos raw, arrays diretos, objetos com campos ad-hoc (`whatsappLink`, `messageId`, `count`). Consumer precisa lembrar o formato de cada rota.

#### Evidencia
- arquivo_ou_area: apps/api/src/routers/clients.ts:~90 (`{ success: true }`); sales.ts:~29 (array direto); messaging.ts:~28 ({ success, whatsappLink, messageId }); analytics.ts (objetos agregados)
- detalhe: Sem documentação; sem TypeScript helper compartilhado

#### Impacto
- tecnico: SDK tipado exige múltiplas narrow types; UI precisa conhecer particularidades
- negocio: Custo de integração alto; risco em mudanças

#### Recomendacao
- acao_sugerida: Padronizar: mutations → `{ success: boolean, data?: T, error?: DomainErrorCode }`; queries de lista → `{ data: T[], meta: { page, limit, total, hasMore } }`; queries de item → `{ data: T }`. Introduzir helpers `ok(data)`, `fail(code)`
- prioridade: alta

---

### ACH-007
- titulo: Paginação sem metadata (`total`, `hasMore`, `nextCursor`)
- severidade: medio
- categoria: contrato-de-api
- status: confirmado
- resumo: `paginationSchema` em `@wbc/validators` define `page/limit/max 100`, mas as procedures `*.list` devolvem apenas o array de items sem total e sem cursor. Cliente não consegue renderizar "N de M" ou otimizar para cursor-based.

#### Evidencia
- arquivo_ou_area: packages/validators/src/common.ts:3-6; apps/api/src/routers/{clients,sales,campaigns,inventory}.ts (queries list)
- detalhe: Nenhuma resposta traz `total` ou `hasMore`

#### Impacto
- tecnico: Cliente precisa inferir "fim" por array menor que `limit`
- negocio: UX de paginação fraca; retries desnecessários

#### Recomendacao
- acao_sugerida: Alterar todos os `list` para retornar `{ data, meta: { page, limit, total, hasMore } }`; considerar cursor-based (`nextCursor`) para listas grandes (analytics, logs)
- prioridade: media

---

### ACH-008
- titulo: Schemas Zod não totalmente centralizados em `@wbc/validators`
- severidade: medio
- categoria: contrato-de-api
- status: confirmado
- resumo: `auth`, `sales` e `finance` importam schemas do pacote `validators`. `clients`, `inventory`, `logistics`, `platform` ainda usam `z.object({ ... })` inline nos routers, duplicando tipos.

#### Evidencia
- arquivo_ou_area: apps/api/src/routers/clients.ts:20-26 (inline); packages/validators/src/sales.ts:4-22 (ok)
- detalhe: Drift silencioso possível

#### Impacto
- tecnico: Dois pontos de verdade para o mesmo input
- negocio: Risco de divergir validação entre validators (usados por UI) e routers

#### Recomendacao
- acao_sugerida: Regra ESLint `no-restricted-syntax` para proibir `z.object({...})` fora de `packages/validators`; migrar schemas remanescentes
- prioridade: media

---

### ACH-009
- titulo: Filtros e ordenação sem convenção de nomenclatura entre routers
- severidade: baixo
- categoria: contrato-de-api
- status: confirmado
- resumo: Clients usa `search`, `classification`, `tagIds`, `isLead`; sales usa `status`, `clientId`; finance usa `category`. Nenhum tem `sort`. Não há convenção documentada.

#### Evidencia
- arquivo_ou_area: apps/api/src/routers/clients.ts:22; sales.ts:27; finance.ts:25
- detalhe: Convenção surge ad-hoc por feature

#### Impacto
- tecnico: SDK precisa hardcode por rota
- negocio: DX ruim para integradores

#### Recomendacao
- acao_sugerida: `filters?: {...}` + `sort?: { by: string, order: 'asc'|'desc' }` em todos `list`; documentar em `docs/API_FILTERING.md`
- prioridade: baixa

---

### ACH-010
- titulo: Datas/timestamps sem contrato explícito no wire (ISO 8601 UTC + timezone)
- severidade: medio
- categoria: contrato-de-api
- status: confirmado
- resumo: `validators` define `z.date()`; tRPC usa `superjson` (serializa Date → ISO). Mas alguns procedures emitem Date cru, e timezone do tenant não é considerada em responses.

#### Evidencia
- arquivo_ou_area: apps/api/src/routers/auth.ts:229 (Date em response); packages/validators/src/clients.ts:44 (z.date())
- detalhe: Sem campo `timezone` em response meta

#### Impacto
- tecnico: Mobile recebe ISO string; UI precisa convert para timezone local sem saber a oficial do tenant
- negocio: Eventos exibidos em horário errado

#### Recomendacao
- acao_sugerida: Explicitar "todas as datas no wire são ISO 8601 UTC"; incluir `timezone: ctx.tenant.timezone` em meta; documentar
- prioridade: media

---

### ACH-011
- titulo: Outbox sem schema Zod por tipo de evento, sem namespace e sem versionamento
- severidade: alto
- categoria: contratos-de-eventos
- status: confirmado
- resumo: Eventos no outbox viajam com `type: string` e `payload: unknown`. Consumers trabalham à base de fé. Sem namespace (`sales.confirmed`) nem versão (`v1`, `v2`), mudar um payload é breaking global.

#### Evidencia
- arquivo_ou_area: apps/worker/src/processors/outbox-processor.ts:14-20; packages/shared/src/events/event-publisher.ts
- detalhe: Sem `packages/shared/src/events/schemas.ts`

#### Impacto
- tecnico: Consumers quebram silenciosamente em mudança de payload
- negocio: Integrações assíncronas instáveis

#### Recomendacao
- acao_sugerida: Criar `packages/shared/src/events/schemas.ts` com `z.discriminatedUnion('type', [...])`, nomes `{module}.{action}.{vN}`, validação no publisher e no consumer; migrar por evento
- prioridade: alta

---

### ACH-012
- titulo: Payloads de job BullMQ sem schema Zod nem validação no worker
- severidade: medio
- categoria: contratos-de-jobs
- status: confirmado
- resumo: Jobs adicionados a `wbc:analytics`, `wbc:campaigns` e `wbc:messaging` chegam ao worker como `any`. Nenhum `z.parse(job.data)` antes de executar. Mudança na forma do payload quebra worker silenciosamente.

#### Evidencia
- arquivo_ou_area: apps/api/src/lib/queues.ts:14,21,28; apps/worker/src/processors/*.ts
- detalhe: Sem docs/JOBS.md

#### Impacto
- tecnico: Worker cresce DLQ sem clareza do motivo
- negocio: Processamento assíncrono frágil

#### Recomendacao
- acao_sugerida: Centralizar schemas em `packages/shared/src/jobs/schemas.ts`; validar no producer e no consumer; documentar com exemplos
- prioridade: media

---

### ACH-013
- titulo: Mapper domain → TRPCError incompleto — cai em `throw error` genérico
- severidade: medio
- categoria: erros
- status: confirmado
- resumo: `mapDomainErrorToTRPC()` cobre ~25 tipos mas não trata `InsufficientPermissionError`, `ExternalServiceError`, `RateLimitExceededError` etc. Casos não mapeados viram 500 Internal Server Error sem detalhes.

#### Evidencia
- arquivo_ou_area: apps/api/src/trpc/error-handler.ts:3-50; ramo final `throw error`
- detalhe: Tipos de erro recentes adicionados ao domínio não são cobertos

#### Impacto
- tecnico: Clientes recebem 500 genérico; dev usa Sentry para investigar
- negocio: DX degradada; difícil correlacionar erro → causa

#### Recomendacao
- acao_sugerida: Incluir mapeamentos para UNAUTHORIZED, FORBIDDEN, SERVICE_UNAVAILABLE, TOO_MANY_REQUESTS, INTERNAL_SERVER_ERROR (com code opaco); testar cada caminho
- prioridade: media

---

### ACH-014
- titulo: Sem OpenAPI/contrato externo — consumo só via SDK tipado `AppRouter`
- severidade: medio
- categoria: documentacao-de-api
- status: confirmado
- resumo: tRPC não gera OpenAPI automaticamente. Sem `trpc-openapi` nem geração de `schema.json`, parceiros externos só consomem via Node.js com tipos.

#### Evidencia
- arquivo_ou_area: ausência de `trpc-openapi` em package.json; sem `docs/API_SPEC.md`
- detalhe: `docs/ARCHITECTURE.md` descreve, mas não provê contrato formal

#### Impacto
- tecnico: Integrações externas não TypeScript (mobile iOS nativo, parceiros de marketplace) precisam de trabalho manual
- negocio: Limita extensão de ecossistema

#### Recomendacao
- acao_sugerida: Avaliar `trpc-openapi` para procedures selecionadas expostas a parceiros; alternativamente gerar JSON Schema a partir dos Zod com `zod-to-json-schema` em build
- prioridade: media

---

### ACH-015
- titulo: Integrações externas sem timeout / retry consistentes — risco de stall em chamada HTTP
- severidade: alto
- categoria: robustez
- status: confirmado
- resumo: Adapters `DeepSeek` e `WhatsApp-N2` aplicam `CircuitBreaker` + `AbortSignal.timeout`; porém, adapters auxiliares (`whatsapp-n1`, `resend-email-sender`, futuros MP) usam `fetch` padrão sem `AbortSignal` nem timeout explícito. `fetch` Node.js sem timeout roda indefinidamente.

#### Evidencia
- arquivo_ou_area: packages/business/messaging/adapters/whatsapp-n2-adapter.ts (ok); packages/business/auth/adapters/resend-email-sender.adapter.ts (stub sem timeout); demais adapters (inferência)
- detalhe: Sem helper padrão `httpClient` com timeout/retry unificado

#### Impacto
- tecnico: Handler BullMQ pode travar segurando conexão e bloqueando outros jobs
- negocio: Perda de mensagens em janelas de instabilidade da API externa

#### Recomendacao
- acao_sugerida: Criar `packages/shared/src/http/client.ts` com `fetchWithTimeout` + retry/backoff; todos os adapters usam; default 10s por chamada
- prioridade: alta

---

### ACH-016
- titulo: Falta de idempotência *outbound* (chave do lado da API externa) ao enviar WhatsApp/Email
- severidade: alto
- categoria: idempotencia
- status: confirmado
- resumo: Ao enviar uma mensagem WhatsApp, se o adapter timeout e o outbox tentar novamente, a API externa pode processar a mensagem duas vezes (sem idempotency-key no request). Mesmo comportamento no envio de e-mail.

#### Evidencia
- arquivo_ou_area: packages/business/messaging/adapters/whatsapp-n2-adapter.ts (sem header de idempotência); packages/business/auth/adapters/resend-email-sender.adapter.ts (stub)
- detalhe: WhatsApp aceita `X-Request-Id`; Resend aceita `Idempotency-Key`

#### Impacto
- tecnico: Mensagem duplicada em cliente final em caso de retry
- negocio: Spam/reputação; estorno

#### Recomendacao
- acao_sugerida: Gerar `requestId` único (ULID) por tentativa lógica; enviar nos headers apropriados; repetir com mesmo id em retries; testar
- prioridade: alta

---

### ACH-017
- titulo: `event-publisher` falha hard se `OutboxPort` não inicializado
- severidade: medio
- categoria: robustez
- status: confirmado
- resumo: `event-publisher.ts` lança erro se `setOutboxPort()` não foi chamado no startup. Não há fallback, log estruturado ou gate de saúde. Um desenvolvedor que esquece de chamar `setOutboxPort` quebra toda mutation que publica evento.

#### Evidencia
- arquivo_ou_area: packages/shared/src/events/event-publisher.ts:16-17
- detalhe: Sem validação no startup; sem `health.outboxReady`

#### Impacto
- tecnico: Falha silenciosa até o primeiro evento emitido
- negocio: Downtime parcial não rastreável

#### Recomendacao
- acao_sugerida: Validar inicialização em `bootstrap()` (falha rápida); expor gate em `health.ready`; log estruturado com contexto
- prioridade: media

---

### ACH-018
- titulo: Paginação permite `page` arbitrariamente alto (OFFSET gigante é aceito)
- severidade: medio
- categoria: protecao-operacional
- status: confirmado
- resumo: `paginationSchema` limita `limit ≤ 100`, mas `page` só tem `min(1)` — `page: 1_000_000` passa. `prisma-helpers.ts` calcula `skip = (page-1)*limit`, resultando em OFFSET massivo e query degradada.

#### Evidencia
- arquivo_ou_area: packages/validators/src/common.ts:3-6; packages/shared/src/prisma-helpers.ts:23-27
- detalhe: Sem cap em `page` nem validação `page * limit <= 100_000`

#### Impacto
- tecnico: DoS barato via OFFSET gigante em tabelas grandes
- negocio: Degradação de performance em carga maliciosa

#### Recomendacao
- acao_sugerida: Limitar `page ≤ 1000` no schema; preferir cursor-based para listas grandes; registrar no rate-limit como rota cara
- prioridade: media

---

### ACH-019
- titulo: Adapters não validam shape de respostas externas (falha em `data.messages[0].id`)
- severidade: medio
- categoria: robustez
- status: confirmado
- resumo: Em `whatsapp-n2-adapter.ts`, o parser assume `data.messages[0].id`. Se a Meta devolver `messages: null` ou alterar o shape, TypeError não tratado quebra o worker.

#### Evidencia
- arquivo_ou_area: packages/business/messaging/adapters/whatsapp-n2-adapter.ts:85-88
- detalhe: Sem Zod parse da resposta; confia cegamente

#### Impacto
- tecnico: Erro não-tratado mata worker; evento vai para DLQ
- negocio: Perda de mensagens em variações de API externa

#### Recomendacao
- acao_sugerida: `ResponseSchema = z.object({ messages: z.array(z.object({ id: z.string() })).min(1) })`; `parseAsync` antes de acessar
- prioridade: media

---

### ACH-020
- titulo: DLQ consumer apenas loga — sem alerta, retry controlado ou replay
- severidade: medio
- categoria: webhooks-e-eventos
- status: confirmado
- resumo: `apps/worker/src/processors/dlq-processor.ts` registra um `warn` e libera o job. Não existe alerta para Slack/e-mail/Sentry; não há ferramenta de replay; ops não descobre falhas crônicas.

#### Evidencia
- arquivo_ou_area: apps/worker/src/processors/dlq-processor.ts:12-19
- detalhe: Sem integração a canal de incidente; sem comando CLI de replay

#### Impacto
- tecnico: Falhas silenciosas em integrações externas
- negocio: Mensagens não entregues sem ciência

#### Recomendacao
- acao_sugerida: Enviar a `security-logger` + Sentry/Slack com metadata (tenantId, event type, tentativas, último erro); criar comando `audkit-dlq replay <id>`; painel no Grafana com contagem DLQ por tipo
- prioridade: alta
