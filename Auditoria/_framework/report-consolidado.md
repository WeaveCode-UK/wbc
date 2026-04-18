# Relatório Consolidado de Achados — Framework de Auditoria WeaveCode

- gerado_em: 2026-04-18T22:01:43.617Z
- total_achados: 83
- dominios_em_progresso: 0
- dominios_ready_for_finalize: 0
- dominios_blocked: 0
- dominios_com_historico: 4

## Distribuição por severidade

| Severidade | Total |
|---|---|
| critico | 6 |
| alto | 29 |
| medio | 39 |
| baixo | 8 |
| informativo | 1 |

## Distribuição por status

| Status | Total |
|---|---|
| aberto | 13 |
| confirmado | 70 |
| mitigado | 0 |
| resolvido | 0 |
| aceito | 0 |
| nao_aplicavel | 0 |

## Distribuição por domínio

| Domínio | Total |
|---|---|
| arquitetura | 13 |
| codigo-manutenibilidade | 22 |
| seguranca | 28 |
| apis-integracoes | 20 |

## Achados ordenados por severidade

### [critico] ACH-001 — Idempotência é opcional — aplicada apenas em sales e finance; demais mutations vulneráveis a duplicidade

- dominio: apis-integracoes
- run: 2026-04-18_22-30-59 (finalized)
- categoria: idempotencia
- status: confirmado
- resumo: O wrapper `idempotent()` (TTL 24h no Redis) é aplicado em mutations de `sales.*` e `finance.*`. As demais mutations críticas (`auth.acceptInvite`, `campaigns.sendCampaign`, `messaging.send*`, `clients.create/update`, `catalog.*`, `inventory.*`) não usam a chave, então um retry de rede executa a mutation duas vezes.
- evidencia.arquivo_ou_area: apps/api/src/routers/sales.ts:36-78; apps/api/src/routers/finance.ts:29-32; apps/api/src/routers/{auth,campaigns,messaging,clients,catalog,inventory}.ts (sem `idempotent()`); apps/api/src/trpc/idempotency-middleware.ts
- impacto.tecnico: Duplicidade em eventos, cobranças ou notificações em caso de retry do cliente

### [critico] ACH-002 — Sem versionamento de API nem estratégia de breaking-change

- dominio: apis-integracoes
- run: 2026-04-18_22-30-59 (finalized)
- categoria: versionamento
- status: confirmado
- resumo: Não existe prefixo `/v1/` nem header `wbc-api-version`. A constante `API_VERSION = '1.0.0'` aparece apenas em `health.version`. Consumer (apps/mobile) depende do tipo `AppRouter` gerado em build; uma mudança removendo campo em schema Zod quebra o build do cliente sem aviso.
- evidencia.arquivo_ou_area: packages/shared/src/version.ts:1-3; apps/api/src/routers/health.ts:22-25; apps/api/src/trpc/router.ts (export type AppRouter)
- impacto.tecnico: Impossível roll-out gradual; mobile antigo pode ficar broken silenciosamente após breaking change

### [critico] ACH-009 — Worker sem graceful shutdown — risco de perda de jobs em-flight

- dominio: arquitetura
- run: 2026-04-18_18-17-50 (finalized)
- categoria: operabilidade
- status: aberto
- resumo: O worker em `apps/worker/src/index.ts` inicia 5 workers BullMQ (messaging, campaign, schedule, analytics, dlq) e usa `setInterval` para polling de outbox (5s), cleanup (24h) e DLQ (60s), mas não trata `SIGTERM`/`SIGINT`. Em container restart ou deploy, jobs em-flight são abortados abruptamente, violando a garantia at-least-once declarada no ADR-003 (outbox + BullMQ).
- evidencia.arquivo_ou_area: wbc/apps/worker/src/index.ts, wbc/docker-compose.prod.yml
- impacto.tecnico: Perda silenciosa da garantia "at-least-once" — jobs podem morrer entre `take` e `ack`. Outbox pode ficar inconsistente (evento publicado sem processamento completo). Cleanup e DLQ interrompidos no meio podem deixar estado intermediário.

### [critico] ACH-001 — TODOs críticos em auth — token storage, email sender e reset não implementados

- dominio: codigo-manutenibilidade
- run: 2026-04-18_21-45-58 (finalized)
- categoria: completude-implementacao
- status: confirmado
- resumo: Fluxos de password reset, email verification e request-email-verification geram token mas não persistem no Redis nem validam no consumo; adapter Resend é stub. Bloqueia uso em produção dos fluxos de auth por link.
- evidencia.arquivo_ou_area: packages/business/auth/use-cases/verify-email.use-case.ts:11; reset-password.use-case.ts:16; request-email-verification.use-case.ts:21; request-password-reset.use-case.ts:22; packages/business/auth/adapters/resend-email-sender.adapter.ts:7
- impacto.tecnico: Código parece funcional mas não completa o fluxo; depuração difícil porque o caminho feliz emite eventos sem efeito

### [critico] ACH-001 — reset-password e verify-email não implementados — endpoints públicos vulneráveis

- dominio: seguranca
- run: 2026-04-18_22-06-18 (finalized)
- categoria: autenticacao
- status: confirmado
- resumo: Os use-cases `ResetPassword` e `VerifyEmail` lançam "not yet implemented". Sem persistência de token (Redis) e sem validação de expiração, o endpoint público aceita qualquer token e pode ser iterado ou, na implementação apressada, aceitar valores inválidos. Fluxos de recuperação e verificação não funcionam em produção.
- evidencia.arquivo_ou_area: packages/business/auth/use-cases/reset-password.use-case.ts:15-19; packages/business/auth/use-cases/verify-email.use-case.ts:10-11; packages/business/auth/use-cases/request-password-reset.use-case.ts:21-23; packages/business/auth/use-cases/request-email-verification.use-case.ts:21
- impacto.tecnico: Fluxo de reset quebrado; se ativado sem validação, permite account takeover com token arbitrário

### [critico] ACH-002 — OTP registrado em console.log em ambiente não-produção

- dominio: seguranca
- run: 2026-04-18_22-06-18 (finalized)
- categoria: exposicao-de-credenciais
- status: confirmado
- resumo: Em `send-otp.ts`, o código OTP é emitido por `console.log` quando NODE_ENV não é "production". Se staging ou ambiente compartilhado rodar com env incorreto, códigos OTP vazam para stdout/arquivos de log.
- evidencia.arquivo_ou_area: packages/business/auth/use-cases/send-otp.ts:37-39
- impacto.tecnico: OTP persistido em logs (stdout, syslog, agregadores) de longa duração

### [alto] ACH-003 — Webhooks inbound — MercadoPago sem handler e WhatsApp sem rota HTTP declarada

- dominio: apis-integracoes
- run: 2026-04-18_22-30-59 (finalized)
- categoria: webhooks
- status: confirmado
- resumo: `whatsapp-webhook-handler.ts` implementa verificação HMAC, mas nenhuma rota `/api/webhooks/whatsapp` foi encontrada em apps/api ou apps/web. Além disso, o Prisma schema referencia `mercadopagoId`, mas não há adapter/handler para receber notificações de pagamento do MercadoPago.
- evidencia.arquivo_ou_area: packages/business/messaging/adapters/whatsapp-webhook-handler.ts; ausência de rota HTTP montando o handler; ausência de adapter `mercadopago-webhook-handler.ts`
- impacto.tecnico: Status updates do WhatsApp e confirmações de pagamento do MP não chegam ao sistema; sincronização precisa ser manual

### [alto] ACH-004 — Webhook WhatsApp sem proteção contra replay (sem checagem de timestamp e sem cache de request-id)

- dominio: apis-integracoes
- run: 2026-04-18_22-30-59 (finalized)
- categoria: webhooks
- status: confirmado
- resumo: O handler valida apenas HMAC; não confronta `entry[0].changes[0].value.timestamp` com `now ± 300s` nem armazena `request-id` em Redis para deduplicação.
- evidencia.arquivo_ou_area: packages/business/messaging/adapters/whatsapp-webhook-handler.ts (verifica apenas HMAC; não faz replay protection)
- impacto.tecnico: Processa webhook duplicado ou antigo — pode duplicar eventos no outbox e reenviar notificações

### [alto] ACH-005 — Tipo `AppRouter` exportado sem deprecation path — breaking change atinge web e mobile ao mesmo tempo

- dominio: apis-integracoes
- run: 2026-04-18_22-30-59 (finalized)
- categoria: compatibilidade
- status: confirmado
- resumo: Mobile e web consomem o tipo `AppRouter` exportado de `apps/api/src/trpc/router.ts`. Remover ou renomear campo de input/output quebra build/runtime imediatamente; não há deprecação marcada.
- evidencia.arquivo_ou_area: apps/api/src/trpc/router.ts:19-36 (export type AppRouter)
- impacto.tecnico: Sincronização rígida entre backend e clientes

### [alto] ACH-006 — Response shape heterogêneo — ausência de envelope padronizado

- dominio: apis-integracoes
- run: 2026-04-18_22-30-59 (finalized)
- categoria: contrato-de-api
- status: confirmado
- resumo: Procedures retornam formatos inconsistentes: `{ success: true }`, objetos raw, arrays diretos, objetos com campos ad-hoc (`whatsappLink`, `messageId`, `count`). Consumer precisa lembrar o formato de cada rota.
- evidencia.arquivo_ou_area: apps/api/src/routers/clients.ts:~90 (`{ success: true }`); sales.ts:~29 (array direto); messaging.ts:~28 ({ success, whatsappLink, messageId }); analytics.ts (objetos agregados)
- impacto.tecnico: SDK tipado exige múltiplas narrow types; UI precisa conhecer particularidades

### [alto] ACH-011 — Outbox sem schema Zod por tipo de evento, sem namespace e sem versionamento

- dominio: apis-integracoes
- run: 2026-04-18_22-30-59 (finalized)
- categoria: contratos-de-eventos
- status: confirmado
- resumo: Eventos no outbox viajam com `type: string` e `payload: unknown`. Consumers trabalham à base de fé. Sem namespace (`sales.confirmed`) nem versão (`v1`, `v2`), mudar um payload é breaking global.
- evidencia.arquivo_ou_area: apps/worker/src/processors/outbox-processor.ts:14-20; packages/shared/src/events/event-publisher.ts
- impacto.tecnico: Consumers quebram silenciosamente em mudança de payload

### [alto] ACH-015 — Integrações externas sem timeout / retry consistentes — risco de stall em chamada HTTP

- dominio: apis-integracoes
- run: 2026-04-18_22-30-59 (finalized)
- categoria: robustez
- status: confirmado
- resumo: Adapters `DeepSeek` e `WhatsApp-N2` aplicam `CircuitBreaker` + `AbortSignal.timeout`; porém, adapters auxiliares (`whatsapp-n1`, `resend-email-sender`, futuros MP) usam `fetch` padrão sem `AbortSignal` nem timeout explícito. `fetch` Node.js sem timeout roda indefinidamente.
- evidencia.arquivo_ou_area: packages/business/messaging/adapters/whatsapp-n2-adapter.ts (ok); packages/business/auth/adapters/resend-email-sender.adapter.ts (stub sem timeout); demais adapters (inferência)
- impacto.tecnico: Handler BullMQ pode travar segurando conexão e bloqueando outros jobs

### [alto] ACH-016 — Falta de idempotência *outbound* (chave do lado da API externa) ao enviar WhatsApp/Email

- dominio: apis-integracoes
- run: 2026-04-18_22-30-59 (finalized)
- categoria: idempotencia
- status: confirmado
- resumo: Ao enviar uma mensagem WhatsApp, se o adapter timeout e o outbox tentar novamente, a API externa pode processar a mensagem duas vezes (sem idempotency-key no request). Mesmo comportamento no envio de e-mail.
- evidencia.arquivo_ou_area: packages/business/messaging/adapters/whatsapp-n2-adapter.ts (sem header de idempotência); packages/business/auth/adapters/resend-email-sender.adapter.ts (stub)
- impacto.tecnico: Mensagem duplicada em cliente final em caso de retry

### [alto] ACH-002 — Topologia de deploy/runtime de produção não documentada

- dominio: arquitetura
- run: 2026-04-18_18-17-50 (finalized)
- categoria: contexto
- status: aberto
- resumo: Existem artefatos de deploy (`Dockerfile.web`, `Dockerfile.worker`, `deploy/nginx.conf`, Prometheus alerts, `docker-compose.prod.yml`, scripts de backup), mas nenhum documento arquitetural explica a topologia em produção: quantas réplicas, recursos alocados, dependências de ordem de boot, estratégia de failover, localização (host único vs cluster), RTO/RPO para disaster recovery, estratégia de reconnect do Redis, procedimento de restore de backup.
- evidencia.arquivo_ou_area: wbc/deploy/, wbc/docker-compose.yml, wbc/docker-compose.prod.yml
- impacto.tecnico: Incerteza sobre pontos únicos de falha, latência inter-app, escalabilidade horizontal. Troubleshooting em incidente fica lento por falta de visão consolidada. Dificuldade de validar coerência entre o que foi configurado (nginx, BullMQ workers, réplicas) e o que foi intencionado arquiteturalmente.

### [alto] ACH-005 — Lógica de domínio (cálculos de negócio) vazada em adapters Prisma

- dominio: arquitetura
- run: 2026-04-18_18-17-50 (finalized)
- categoria: hexagonal-violation
- status: aberto
- resumo: Adapters Prisma (que deveriam apenas traduzir Prisma ↔ domínio) contêm cálculos de regras de negócio: subtotal, total, desconto, cashback em `sales`; classificação ABC e engagement score em `analytics`; teto/piso de cashback em `sales/cashback`. Isso viola o princípio hexagonal declarado no ADR-001: regras de negócio devem residir em `domain/entities` ou `domain/services`, não em adapters.
- evidencia.arquivo_ou_area: wbc/packages/business/sales/adapters/prisma-sale-repository.ts, wbc/packages/business/analytics/adapters/prisma-analytics-repository.ts, wbc/packages/business/sales/adapters/prisma-cashback-repository.ts
- impacto.tecnico: Cálculos críticos residem onde mudam com schema Prisma; lógica não testável isoladamente (exige setup de DB); difícil mover de Prisma para outro ORM; duplicação potencial se outro adapter precisar da mesma regra.

### [alto] ACH-002 — `index.ts` de packages/business expõe adapters e use-cases sem barreira

- dominio: codigo-manutenibilidade
- run: 2026-04-18_21-45-58 (finalized)
- categoria: boundary-e-coesao
- status: confirmado
- resumo: Os barrel exports em `packages/business/<modulo>/index.ts` reexportam `domain/`, `adapters/` e `use-cases/` inteiros. Consumidores podem importar `PrismaClientRepository` diretamente, violando o boundary da arquitetura hexagonal.
- evidencia.arquivo_ou_area: packages/business/auth/index.ts; packages/business/clients/index.ts; packages/business/catalog/index.ts; packages/business/inventory/index.ts; packages/business/messaging/index.ts; packages/business/sales/index.ts; packages/business/schedule/index.ts
- impacto.tecnico: Refatorar adapter (ex: trocar driver Prisma) quebra consumidores em cascata; dependency-cruiser sozinho não impede se import vem por barrel

### [alto] ACH-003 — Ausência de composition root — repositórios instanciados como singletons no topo dos routers

- dominio: codigo-manutenibilidade
- run: 2026-04-18_21-45-58 (finalized)
- categoria: injecao-de-dependencia
- status: confirmado
- resumo: Cada router tRPC cria suas próprias instâncias de `PrismaXxxRepository` no escopo do módulo. Não existe factory, container ou contexto central. Padrão replica em todos os routers e em adapters internos.
- evidencia.arquivo_ou_area: apps/api/src/routers/auth.ts:61-68; apps/api/src/routers/clients.ts:15-16; apps/api/src/routers/sales.ts:20-23; apps/api/src/routers/catalog.ts:12-14; apps/api/src/lib/queues.ts:4-31; apps/api/src/lib/redis.ts:7
- impacto.tecnico: Troca de implementação exige editar N arquivos; testes unitários inviáveis sem mock de módulo; difícil aplicar decorators (ex: cache, tracing, feature flag) sem modificar cada router

### [alto] ACH-004 — Schemas Zod duplicados entre `packages/validators` e routers inline

- dominio: codigo-manutenibilidade
- run: 2026-04-18_21-45-58 (finalized)
- categoria: duplicacao-e-consistencia
- status: confirmado
- resumo: `packages/validators/src/clients.ts` define `createClientSchema` completo, mas `apps/api/src/routers/clients.ts` reescreve schema equivalente inline. Adicionar um campo exige mudança em 5+ lugares (Prisma, domain, validators, router inline, UI).
- evidencia.arquivo_ou_area: packages/validators/src/clients.ts:4-46 versus apps/api/src/routers/clients.ts:20-54
- impacto.tecnico: Alto risco de desincronia validador vs API; regra de negócio duplicada

### [alto] ACH-007 — Callback `jwt` em `auth.config.ts` com lógica complexa e estado mutável

- dominio: codigo-manutenibilidade
- run: 2026-04-18_21-45-58 (finalized)
- categoria: complexidade-cognitiva
- status: confirmado
- resumo: O callback `jwt` em `apps/web/src/lib/auth.config.ts` (~50 linhas, aninhamento ≥4) resolve workspace membership, detecta onboarding/selection, e responde a triggers `update`. Cinco campos do token (`tid`, `mid`, `role`, `plan`, `needsOnboarding`) são mutados em combinações distintas.
- evidencia.arquivo_ou_area: apps/web/src/lib/auth.config.ts:65-114
- impacto.tecnico: Difícil testar combinações; regressão silenciosa provável em mudanças de regra; debug em produção depende de logs de sessão

### [alto] ACH-013 — Side-effects pesados no entry-point ao importar módulos

- dominio: codigo-manutenibilidade
- run: 2026-04-18_21-45-58 (finalized)
- categoria: testabilidade
- status: confirmado
- resumo: `apps/api/src/index.ts` e `apps/worker/src/index.ts` executam `initTracing`, `initSentry`, `applyTenantMiddleware`, abrem conexões Redis e registram `setInterval` no topo do arquivo. Importar qualquer símbolo dispara todo o bootstrap.
- evidencia.arquivo_ou_area: apps/api/src/index.ts:1-24; apps/worker/src/index.ts:1-74
- impacto.tecnico: Impede testes de unidade por import direto; dificulta múltiplos modos (ex: CLI sem tracing)

### [alto] ACH-003 — Autenticação por credenciais sem proteção contra brute-force

- dominio: seguranca
- run: 2026-04-18_22-06-18 (finalized)
- categoria: autenticacao
- status: confirmado
- resumo: `AuthenticateWithCredentials` valida email/senha via bcrypt sem contador de falhas por conta ou IP. O rate-limit genérico (100 req/min protected / 30 req/min public) é alto demais para autenticação.
- evidencia.arquivo_ou_area: packages/business/auth/use-cases/authenticate-with-credentials.use-case.ts; apps/api/src/trpc/rate-limit-middleware.ts:9-10
- impacto.tecnico: Força bruta online viável para senhas fracas

### [alto] ACH-004 — Enumeração de contas por mensagens de erro distintas

- dominio: seguranca
- run: 2026-04-18_22-06-18 (finalized)
- categoria: autenticacao
- status: confirmado
- resumo: `AuthenticateWithCredentials` retorna mensagens distintas para "conta não encontrada" vs "senha incorreta". Permite enumerar e-mails válidos no sistema.
- evidencia.arquivo_ou_area: packages/business/auth/use-cases/authenticate-with-credentials.use-case.ts:18-26
- impacto.tecnico: Enumeração simplifica ataques dirigidos

### [alto] ACH-005 — `findByToken` de invites sem validação de status e expiração

- dominio: seguranca
- run: 2026-04-18_22-06-18 (finalized)
- categoria: autorizacao
- status: confirmado
- resumo: Em `prisma-invite.repository.ts`, `findByToken` não filtra `status = 'PENDING'` nem `expiresAt > now`. Invites EXPIRED ou ACCEPTED podem ser reusados se o token vazar.
- evidencia.arquivo_ou_area: packages/business/auth/adapters/prisma-invite.repository.ts:16-20
- impacto.tecnico: Reuso de invites antigos; inclusão em tenant errado

### [alto] ACH-006 — Sessão JWT de 15 min sem revogação e sem rotation explícita

- dominio: seguranca
- run: 2026-04-18_22-06-18 (finalized)
- categoria: sessao-e-tokens
- status: confirmado
- resumo: `apps/web/src/lib/auth.config.ts` usa NextAuth JWT strategy com `maxAge: 15*60`. Não há blacklist no logout nem rotation de token em `jwt update`. Usuário removido do workspace mantém acesso até o token expirar.
- evidencia.arquivo_ou_area: apps/web/src/lib/auth.config.ts:131-134; packages/business/auth/use-cases/revoke-session.use-case.ts; apps/web/src/lib/auth.ts
- impacto.tecnico: Janela de até 15 min com sessão ativa após logout ou remoção do usuário

### [alto] ACH-007 — Ausência de MFA/TOTP

- dominio: seguranca
- run: 2026-04-18_22-06-18 (finalized)
- categoria: autenticacao
- status: confirmado
- resumo: Não há implementação de MFA (TOTP, WebAuthn, SMS) para contas humanas. Autenticação restringe-se a e-mail+senha e OAuth Google.
- evidencia.arquivo_ou_area: packages/business/auth/ (sem use-cases de TOTP/WebAuthn); packages/shared/src/security-logger.ts (sem eventos MFA)
- impacto.tecnico: Senha comprometida = acesso total ao tenant

### [alto] ACH-008 — Mass assignment potencial em updates — repositórios aceitam `Partial<Entity>` inteiro

- dominio: seguranca
- run: 2026-04-18_22-06-18 (finalized)
- categoria: validacao-de-entrada
- status: confirmado
- resumo: `PrismaClientRepository.update` e outros repos recebem `Partial<Entity>` completo. A proteção depende integralmente do Zod inline no router. Se o schema drift e um campo sensível (ex.: `classification`, `accountId`) entrar no input, é gravado sem cerca adicional.
- evidencia.arquivo_ou_area: packages/business/clients/adapters/prisma-client-repository.ts:39-48 (e padrões equivalentes em sales/messaging/finance); apps/api/src/routers/clients.ts (Zod inline)
- impacto.tecnico: Campos administrativos ou versioning podem ser atualizados por input externo se validador for enfraquecido

### [alto] ACH-009 — Validação de URLs aceitas para avatar permite SSRF

- dominio: seguranca
- run: 2026-04-18_22-06-18 (finalized)
- categoria: validacao-de-entrada
- status: confirmado
- resumo: Schemas em `@wbc/validators` permitem `z.string().url()` para avatar/display sem allowlist de domínio. Qualquer URL válida é aceita — inclusive `http://localhost:8080` ou metadata endpoints cloud se o servidor baixar a imagem no backend.
- evidencia.arquivo_ou_area: packages/validators/src/auth.ts:10,30,44
- impacto.tecnico: Se algum componente server-side baixar a imagem (ex.: para gerar og-image), atacante acessa recursos internos

### [alto] ACH-010 — Cookies de sessão sem `secure`/`httpOnly`/`sameSite` explícitos no NextAuth config

- dominio: seguranca
- run: 2026-04-18_22-06-18 (finalized)
- categoria: sessao-e-tokens
- status: confirmado
- resumo: O config em `apps/web/src/lib/auth.config.ts` não define `cookies.sessionToken.options.{secure,httpOnly,sameSite}` explicitamente. NextAuth aplica defaults seguros em produção, mas sem validação, uma mudança de env ou versão pode relaxá-los silenciosamente.
- evidencia.arquivo_ou_area: apps/web/src/lib/auth.config.ts:131-134
- impacto.tecnico: MITM captura cookies se HTTPS falhar; XSS lê cookie se httpOnly falhar

### [alto] ACH-011 — CSP de produção permite `'unsafe-inline'` para scripts e estilos

- dominio: seguranca
- run: 2026-04-18_22-06-18 (finalized)
- categoria: headers-de-seguranca
- status: confirmado
- resumo: `apps/web/next.config.mjs` define CSP com `'unsafe-inline'` em produção (linhas 7-18). Em dev adiciona `'unsafe-eval'`. Isso reduz drasticamente a mitigação contra XSS.
- evidencia.arquivo_ou_area: apps/web/next.config.mjs:7-18
- impacto.tecnico: Exploração de XSS se material injetado contornar escaping do React

### [alto] ACH-012 — Credenciais externas (DeepSeek, WhatsApp) com fallback silencioso `?? ""`

- dominio: seguranca
- run: 2026-04-18_22-06-18 (finalized)
- categoria: configuracao-sensivel
- status: confirmado
- resumo: Adapters carregam `process.env.DEEPSEEK_API_KEY ?? ""` e similares sem validação. Se variável ausente, serviço falha silenciosamente no runtime; ausência não é detectada no startup.
- evidencia.arquivo_ou_area: packages/business/ai/adapters/deepseek-adapter.ts:35; packages/business/messaging/adapters/whatsapp-n2-adapter.ts:36-37
- impacto.tecnico: Deploy sobe com integração quebrada; erros intermitentes em produção

### [alto] ACH-013 — `WHATSAPP_APP_SECRET` não documentado em `.env.example` / `.env.production.example`

- dominio: seguranca
- run: 2026-04-18_22-06-18 (finalized)
- categoria: configuracao-sensivel
- status: confirmado
- resumo: O handler de webhook WhatsApp exige `WHATSAPP_APP_SECRET` para verificação HMAC, mas a variável não aparece em `.env.example` nem em `.env.production.example`, nem em `turbo.json globalEnv`.
- evidencia.arquivo_ou_area: packages/business/messaging/adapters/whatsapp-webhook-handler.ts (usa APP_SECRET); .env.example; .env.production.example; turbo.json:3-13
- impacto.tecnico: Webhook cai em fallback (assinatura inválida) silenciosamente

### [alto] ACH-014 — Grafana exposto sem autenticação de aplicação (default `admin:admin`)

- dominio: seguranca
- run: 2026-04-18_22-06-18 (finalized)
- categoria: protecao-operacional
- status: confirmado
- resumo: `deploy/nginx.conf` e `docker-compose.prod.yml` expõem Grafana em `/grafana/`; senha do admin usa `GRAFANA_PASSWORD:-admin` como fallback. Nenhum reverse-proxy-auth visível.
- evidencia.arquivo_ou_area: deploy/nginx.conf:68-75; docker-compose.prod.yml:137-150
- impacto.tecnico: Qualquer um com URL pode ver dashboards, métricas e datasources

### [alto] ACH-015 — Ausência de secret scanning em pre-commit e em CI

- dominio: seguranca
- run: 2026-04-18_22-06-18 (finalized)
- categoria: supply-chain
- status: confirmado
- resumo: `lint-staged` só roda `prettier --write`. `.github/workflows/` não possui job de secret scanning (gitleaks/trufflehog) nem dependency scanning (Trivy/Snyk). Secret scanning nativo do GitHub depende de ativação.
- evidencia.arquivo_ou_area: package.json:56-59; .github/workflows/ci.yml
- impacto.tecnico: Um segredo commitado por engano não é detectado automaticamente

### [alto] ACH-016 — Sem Secret Manager nem política de rotação de credenciais

- dominio: seguranca
- run: 2026-04-18_22-06-18 (finalized)
- categoria: gestao-de-credenciais
- status: confirmado
- resumo: Todas as credenciais vivem em `.env` em produção, sem AWS Secrets Manager / GCP SM / Vault / Doppler. Não há documento de rotação (SECURITY.md, SECRET-ROTATION.md).
- evidencia.arquivo_ou_area: .env.production.example; ausência de SECURITY.md ou similar
- impacto.tecnico: Comprometimento exige troca manual sob pressão; sem auditoria de acesso a segredos

### [alto] ACH-017 — Branch protection / CODEOWNERS não visíveis no repositório

- dominio: seguranca
- run: 2026-04-18_22-06-18 (finalized)
- categoria: iam
- status: confirmado
- resumo: Não há arquivo `.github/CODEOWNERS` e não há como verificar branch protection via arquivos. Se a configuração no GitHub estiver ausente, qualquer colaborador com write pode mergear direto.
- evidencia.arquivo_ou_area: .github/ (sem CODEOWNERS); ci.yml existe com lint/type-check/test
- impacto.tecnico: Ausência de revisão obrigatória abre caminho para merges arriscados

### [medio] ACH-007 — Paginação sem metadata (`total`, `hasMore`, `nextCursor`)

- dominio: apis-integracoes
- run: 2026-04-18_22-30-59 (finalized)
- categoria: contrato-de-api
- status: confirmado
- resumo: `paginationSchema` em `@wbc/validators` define `page/limit/max 100`, mas as procedures `*.list` devolvem apenas o array de items sem total e sem cursor. Cliente não consegue renderizar "N de M" ou otimizar para cursor-based.
- evidencia.arquivo_ou_area: packages/validators/src/common.ts:3-6; apps/api/src/routers/{clients,sales,campaigns,inventory}.ts (queries list)
- impacto.tecnico: Cliente precisa inferir "fim" por array menor que `limit`

### [medio] ACH-008 — Schemas Zod não totalmente centralizados em `@wbc/validators`

- dominio: apis-integracoes
- run: 2026-04-18_22-30-59 (finalized)
- categoria: contrato-de-api
- status: confirmado
- resumo: `auth`, `sales` e `finance` importam schemas do pacote `validators`. `clients`, `inventory`, `logistics`, `platform` ainda usam `z.object({ ... })` inline nos routers, duplicando tipos.
- evidencia.arquivo_ou_area: apps/api/src/routers/clients.ts:20-26 (inline); packages/validators/src/sales.ts:4-22 (ok)
- impacto.tecnico: Dois pontos de verdade para o mesmo input

### [medio] ACH-010 — Datas/timestamps sem contrato explícito no wire (ISO 8601 UTC + timezone)

- dominio: apis-integracoes
- run: 2026-04-18_22-30-59 (finalized)
- categoria: contrato-de-api
- status: confirmado
- resumo: `validators` define `z.date()`; tRPC usa `superjson` (serializa Date → ISO). Mas alguns procedures emitem Date cru, e timezone do tenant não é considerada em responses.
- evidencia.arquivo_ou_area: apps/api/src/routers/auth.ts:229 (Date em response); packages/validators/src/clients.ts:44 (z.date())
- impacto.tecnico: Mobile recebe ISO string; UI precisa convert para timezone local sem saber a oficial do tenant

### [medio] ACH-012 — Payloads de job BullMQ sem schema Zod nem validação no worker

- dominio: apis-integracoes
- run: 2026-04-18_22-30-59 (finalized)
- categoria: contratos-de-jobs
- status: confirmado
- resumo: Jobs adicionados a `wbc:analytics`, `wbc:campaigns` e `wbc:messaging` chegam ao worker como `any`. Nenhum `z.parse(job.data)` antes de executar. Mudança na forma do payload quebra worker silenciosamente.
- evidencia.arquivo_ou_area: apps/api/src/lib/queues.ts:14,21,28; apps/worker/src/processors/*.ts
- impacto.tecnico: Worker cresce DLQ sem clareza do motivo

### [medio] ACH-013 — Mapper domain → TRPCError incompleto — cai em `throw error` genérico

- dominio: apis-integracoes
- run: 2026-04-18_22-30-59 (finalized)
- categoria: erros
- status: confirmado
- resumo: `mapDomainErrorToTRPC()` cobre ~25 tipos mas não trata `InsufficientPermissionError`, `ExternalServiceError`, `RateLimitExceededError` etc. Casos não mapeados viram 500 Internal Server Error sem detalhes.
- evidencia.arquivo_ou_area: apps/api/src/trpc/error-handler.ts:3-50; ramo final `throw error`
- impacto.tecnico: Clientes recebem 500 genérico; dev usa Sentry para investigar

### [medio] ACH-014 — Sem OpenAPI/contrato externo — consumo só via SDK tipado `AppRouter`

- dominio: apis-integracoes
- run: 2026-04-18_22-30-59 (finalized)
- categoria: documentacao-de-api
- status: confirmado
- resumo: tRPC não gera OpenAPI automaticamente. Sem `trpc-openapi` nem geração de `schema.json`, parceiros externos só consomem via Node.js com tipos.
- evidencia.arquivo_ou_area: ausência de `trpc-openapi` em package.json; sem `docs/API_SPEC.md`
- impacto.tecnico: Integrações externas não TypeScript (mobile iOS nativo, parceiros de marketplace) precisam de trabalho manual

### [medio] ACH-017 — `event-publisher` falha hard se `OutboxPort` não inicializado

- dominio: apis-integracoes
- run: 2026-04-18_22-30-59 (finalized)
- categoria: robustez
- status: confirmado
- resumo: `event-publisher.ts` lança erro se `setOutboxPort()` não foi chamado no startup. Não há fallback, log estruturado ou gate de saúde. Um desenvolvedor que esquece de chamar `setOutboxPort` quebra toda mutation que publica evento.
- evidencia.arquivo_ou_area: packages/shared/src/events/event-publisher.ts:16-17
- impacto.tecnico: Falha silenciosa até o primeiro evento emitido

### [medio] ACH-018 — Paginação permite `page` arbitrariamente alto (OFFSET gigante é aceito)

- dominio: apis-integracoes
- run: 2026-04-18_22-30-59 (finalized)
- categoria: protecao-operacional
- status: confirmado
- resumo: `paginationSchema` limita `limit ≤ 100`, mas `page` só tem `min(1)` — `page: 1_000_000` passa. `prisma-helpers.ts` calcula `skip = (page-1)*limit`, resultando em OFFSET massivo e query degradada.
- evidencia.arquivo_ou_area: packages/validators/src/common.ts:3-6; packages/shared/src/prisma-helpers.ts:23-27
- impacto.tecnico: DoS barato via OFFSET gigante em tabelas grandes

### [medio] ACH-019 — Adapters não validam shape de respostas externas (falha em `data.messages[0].id`)

- dominio: apis-integracoes
- run: 2026-04-18_22-30-59 (finalized)
- categoria: robustez
- status: confirmado
- resumo: Em `whatsapp-n2-adapter.ts`, o parser assume `data.messages[0].id`. Se a Meta devolver `messages: null` ou alterar o shape, TypeError não tratado quebra o worker.
- evidencia.arquivo_ou_area: packages/business/messaging/adapters/whatsapp-n2-adapter.ts:85-88
- impacto.tecnico: Erro não-tratado mata worker; evento vai para DLQ

### [medio] ACH-020 — DLQ consumer apenas loga — sem alerta, retry controlado ou replay

- dominio: apis-integracoes
- run: 2026-04-18_22-30-59 (finalized)
- categoria: webhooks-e-eventos
- status: confirmado
- resumo: `apps/worker/src/processors/dlq-processor.ts` registra um `warn` e libera o job. Não existe alerta para Slack/e-mail/Sentry; não há ferramenta de replay; ops não descobre falhas crônicas.
- evidencia.arquivo_ou_area: apps/worker/src/processors/dlq-processor.ts:12-19
- impacto.tecnico: Falhas silenciosas em integrações externas

### [medio] ACH-001 — Documentação arquitetural textual mas sem visualização consolidada

- dominio: arquitetura
- run: 2026-04-18_18-17-50 (finalized)
- categoria: documentacao
- status: aberto
- resumo: Projeto tem ADRs formais (hexagonal, multi-tenant, outbox+BullMQ, OTP-only), orquestrador detalhado e regras invioláveis, mas falta um artefato único de visão arquitetural consolidada. Não há diagrama de contexto (C4 Nível 1), mapa de containers (C4 Nível 2), matriz de dados (quem lê/escreve quais tabelas) nem overview executivo de 1-2 páginas. Todo conhecimento arquitetural é textual e disperso entre `docs/adr/`, `begin/`, `CLAUDE.md` e arquivos estruturais.
- evidencia.arquivo_ou_area: wbc/docs/adr/, wbc/begin/, wbc/CLAUDE.md, wbc/README.md
- impacto.tecnico: Onboarding lento — novos desenvolvedores precisam reconstruir a visão arquitetural lendo múltiplos arquivos. Discussões de escopo e impacto ficam mais longas por falta de referência visual compartilhada. Risco de escolhas de design incoerentes por ausência de ancoragem visual da arquitetura.

### [medio] ACH-004 — Fluxos de eventos inter-módulos não mapeados em catálogo central

- dominio: arquitetura
- run: 2026-04-18_18-17-50 (finalized)
- categoria: arquitetura-declarada
- status: aberto
- resumo: Eventos de domínio existem em cada módulo business (SaleConfirmed, CashbackGenerated, ClientCreated, etc.) e há implementação outbox + BullMQ (ADR-003), mas não há documentação única consolidada mostrando quais eventos existem, quem publica, quem consome, em qual fila BullMQ cada um roda e qual é o payload canônico. Conhecimento só é reconstrutível lendo arquivos `*.events.ts` e subscribers espalhados.
- evidencia.arquivo_ou_area: wbc/packages/business/*/domain/events.ts (presumido), wbc/packages/business/*/subscribers/ (presumido), wbc/apps/worker/
- impacto.tecnico: Mudanças em eventos (adicionar campo, renomear, remover) exigem busca manual em todo o monorepo; alto risco de subscribers órfãos após refatorações; acoplamento oculto entre módulos que deveriam ser autônomos.

### [medio] ACH-006 — Módulo `ai/` diverge do padrão hexagonal (sem `domain/`)

- dominio: arquitetura
- run: 2026-04-18_18-17-50 (finalized)
- categoria: decomposicao
- status: aberto
- resumo: Dos 16 módulos em `packages/business/*`, 15 seguem o shape hexagonal canônico (`domain/`, `ports/`, `adapters/`, `use-cases/`). O módulo `ai/` diverge: não possui pasta `domain/`. Use-cases de AI (geração de texto, etc.) são procedurais, chamam `AIProvider` e `AIRepository` via ports sem encapsular regras de domínio (limites de tokens, políticas de modelo, métricas de uso) em entidades.
- evidencia.arquivo_ou_area: wbc/packages/business/ai/
- impacto.tecnico: Ambiguidade sobre se o módulo é deliberadamente anêmico (gateway puro para provider externo) ou se está incompleto. Regras sobre rate limit de tokens, política de modelo escolhido, quotas, acumulação de uso ficam inline nos use-cases — dificulta teste unitário puro e evolução.

### [medio] ACH-007 — Ausência de enforcement automatizado para regras hexagonal

- dominio: arquitetura
- run: 2026-04-18_18-17-50 (finalized)
- categoria: hexagonal-violation
- status: aberto
- resumo: As regras hexagonal (`domain/` não importa de `adapters/`; `use-cases/` importam apenas de `ports/`, não de `adapters/` diretamente; comunicação inter-módulo apenas via eventos) existem apenas como convenção textual em CLAUDE.md e ADRs. Não há linter rule, teste arquitetural automatizado ou hook que previna violação em code review.
- evidencia.arquivo_ou_area: wbc/package.json, wbc/.eslintrc.*, wbc/.husky/ (pre-commit), wbc/docs/adr/001-hexagonal-architecture.md
- impacto.tecnico: Violações arquiteturais passam por code review sem alerta automático; a arquitetura declarada depende exclusivamente de disciplina manual; cada novo dev precisa internalizar as regras antes de contribuir com segurança.

### [medio] ACH-008 — Políticas de retry, timeout e circuit breaker hardcoded em cada adapter externo

- dominio: arquitetura
- run: 2026-04-18_18-17-50 (finalized)
- categoria: cross-cutting
- status: aberto
- resumo: Cada adapter que chama serviço externo (WhatsApp N2, DeepSeek, e potencialmente outros) define constantes próprias de `MAX_RETRIES`, `TIMEOUT_MS`, `RETRY_DELAY_MS` e instancia seu próprio `CircuitBreaker` com thresholds locais. Não há política centralizada em `@wbc/shared` ou `config` que padronize ou permita ajuste global.
- evidencia.arquivo_ou_area: wbc/packages/business/messaging/adapters/whatsapp-n2-adapter.ts, wbc/packages/business/ai/adapters/deepseek-adapter.ts
- impacto.tecnico: Ajustar política de retry globalmente exige alterar N adapters; inconsistência entre providers impede observabilidade operacional consolidada; novas integrações tendem a copiar o padrão errado.

### [medio] ACH-010 — Decisões de resiliência (retry, circuit breaker, DLQ, cleanup) sem ADR

- dominio: arquitetura
- run: 2026-04-18_18-17-50 (finalized)
- categoria: decisao-sem-adr
- status: aberto
- resumo: `CircuitBreaker` é usado em adapters externos, DLQ processor existe em `apps/worker`, cleanup de outbox roda diariamente — mas não há ADR documentando a estratégia de resiliência: por que circuit breaker com thresholds X, por que DLQ apenas loga (sem API de resgate), por que cleanup é diário.
- evidencia.arquivo_ou_area: wbc/docs/adr/ (não há ADR-005+ de resiliência), wbc/apps/worker/src/processors/dlq-processor.ts, wbc/packages/shared/ (CircuitBreaker)
- impacto.tecnico: Novas integrações repetem o padrão ou divergem sem orientação; não há baseline para discussão de SLO; retrabalho caso a estratégia precise mudar.

### [medio] ACH-011 — Health checks mínimos; sem readiness distinto de liveness e sem métricas de lag de worker

- dominio: arquitetura
- run: 2026-04-18_18-17-50 (finalized)
- categoria: operabilidade
- status: aberto
- resumo: Endpoint de health em `apps/api` verifica apenas ping de DB e Redis. Não há distinção entre readiness (pronto para receber tráfego) e liveness (processo vivo). Worker não expõe endpoint de health nem métricas de lag (profundidade de filas BullMQ, idade do outbox mais antigo, contagem de DLQ). Docker Compose tem healthcheck para Postgres/Redis mas não para web/worker.
- evidencia.arquivo_ou_area: wbc/apps/api/src/routers/health.ts (presumido, conforme agente), wbc/apps/worker/src/index.ts, wbc/docker-compose.prod.yml
- impacto.tecnico: Orchestrator (Docker/Kubernetes) não consegue detectar worker travado ou faminto; Prometheus alertas não disparam para starvation; incidente só aparece quando usuário reclama.

### [medio] ACH-012 — Isolamento multi-tenant em Redis depende apenas de convenção de prefixo manual

- dominio: arquitetura
- run: 2026-04-18_18-17-50 (finalized)
- categoria: seguranca-estrutural
- status: aberto
- resumo: Redis único compartilhado entre todos os tenants para cache (entitlements), BullMQ queues e outbox sub. O isolamento por tenant depende de cada código cliente incluir manualmente o `tenantId` no prefixo de chave (ex: `wbc:entitlements:${tenantId}`), sem enforcement automatizado. O ADR-002 declara multi-tenant com tenantId obrigatório em queries Prisma, mas essa disciplina não é replicada em Redis via infra.
- evidencia.arquivo_ou_area: wbc/docker-compose.prod.yml (único Redis), wbc/apps/api/src/lib/cache.ts, wbc/apps/api/src/lib/queues.ts, wbc/apps/worker/src/index.ts
- impacto.tecnico: Possível vazamento cruzado acidental se um desenvolvedor esquecer o prefixo; padrões de latência de fila de um tenant podem ser inferidos por outro (baixo risco mas existe).

### [medio] ACH-005 — `packages/shared` é saco de utilitários incoeso (tema UI + infra + eventos + resiliência)

- dominio: codigo-manutenibilidade
- run: 2026-04-18_21-45-58 (finalized)
- categoria: coesao-de-pacote
- status: confirmado
- resumo: `packages/shared/src/index.ts` exporta tema (cores, tipografia), circuit-breaker, Redis, event-publisher, outbox-service, security-logger, prisma-helpers, resilience policies. Responsabilidades ortogonais no mesmo pacote.
- evidencia.arquivo_ou_area: packages/shared/src/index.ts (15 reexports)
- impacto.tecnico: Tree-shaking prejudicado; bundles maiores no cliente; mudança em infra atinge UI indiretamente

### [medio] ACH-006 — Singleton global de `PrismaClient` em `packages/db` sem contrato de ciclo de vida

- dominio: codigo-manutenibilidade
- run: 2026-04-18_21-45-58 (finalized)
- categoria: isolamento-multi-tenant
- status: confirmado
- resumo: `packages/db/src/index.ts` exporta `prisma` como singleton compartilhado via `globalThis`. O isolamento multi-tenant depende de middleware + AsyncLocalStorage global. Testar lógica que toque Prisma exige mocks invasivos e qualquer request sem tenant setado pode vazar por omissão.
- evidencia.arquivo_ou_area: packages/db/src/index.ts:4-14; packages/db/src/tenant-context.ts
- impacto.tecnico: Riscos sutis de data leak cross-tenant em race conditions; testes de unidade em `packages/business/*/adapters/*.ts` impossíveis sem DB real

### [medio] ACH-008 — Router `auth.ts` com 391 linhas e 17 procedures heterogêneas

- dominio: codigo-manutenibilidade
- run: 2026-04-18_21-45-58 (finalized)
- categoria: god-file
- status: confirmado
- resumo: `apps/api/src/routers/auth.ts` concentra instanciação de 8 repositórios + 17 procedures misturando signup, login, invites, OTP e logout. Funções como `acceptInvite` misturam validação, comandos e leitura.
- evidencia.arquivo_ou_area: apps/api/src/routers/auth.ts (391 linhas, 17 procedures)
- impacto.tecnico: Alto risco de conflito em PRs; entendimento parcial obrigatório para qualquer mudança

### [medio] ACH-009 — Type casting `as unknown as X` em mappers Prisma e Redis sem justificativa

- dominio: codigo-manutenibilidade
- run: 2026-04-18_21-45-58 (finalized)
- categoria: tipagem
- status: confirmado
- resumo: Ocorrências de `as unknown as Record<string, unknown>` e `as unknown as typeof redisClient` em caminhos críticos (idempotência, cache, mappers de venda/OTP). Mascara falhas de tipagem e oculta dívida de schema.
- evidencia.arquivo_ou_area: apps/api/src/trpc/idempotency-middleware.ts:7; apps/api/src/lib/cache.ts:20; packages/business/sales/adapters/prisma-sale-repository.ts:11-27,40-42,66,113,133
- impacto.tecnico: Falsos positivos em mudanças de schema; checker TypeScript perde capacidade de alertar

### [medio] ACH-010 — Números mágicos espalhados para TTLs, intervalos, janelas e thresholds

- dominio: codigo-manutenibilidade
- run: 2026-04-18_21-45-58 (finalized)
- categoria: configuracao-e-constantes
- status: confirmado
- resumo: Valores como 5000 (outbox poll), 60_000 (DLQ scan / rate window), 24*60*60*1000 (cleanup diário), 300 (TTL cache) aparecem hardcoded em múltiplos arquivos. Não há `constants/timings.ts` central.
- evidencia.arquivo_ou_area: apps/worker/src/index.ts:74,118,130; apps/api/src/lib/cache.ts:7,139,141; apps/api/src/trpc/rate-limit-middleware.ts:9-10; apps/worker/src/health-server.ts
- impacto.tecnico: Alterar política exige grep-and-replace; inconsistência entre ambientes

### [medio] ACH-011 — Duplicação de mapeamento entidade↔Prisma em múltiplos adapters

- dominio: codigo-manutenibilidade
- run: 2026-04-18_21-45-58 (finalized)
- categoria: duplicacao
- status: confirmado
- resumo: Mappers `toDomain`/`toPrisma` reescrevem o mesmo padrão de projeção em `sales`, `clients`, `auth/otp`. Mudança de entidade exige editar N adapters sem base comum.
- evidencia.arquivo_ou_area: packages/business/sales/adapters/prisma-sale-repository.ts:11-27; packages/business/auth/adapters/prisma-otp-repository.ts:22-52; packages/business/clients/adapters/prisma-client-repository.ts (projeções repetidas)
- impacto.tecnico: Alto risco de drift entre adapters após mudança de entidade

### [medio] ACH-012 — Literais de status/enum espalhados em filtros Prisma

- dominio: codigo-manutenibilidade
- run: 2026-04-18_21-45-58 (finalized)
- categoria: consistencia-de-dominio
- status: confirmado
- resumo: Valores como `"CONFIRMED"`, `"DELIVERED"`, `"DRAFT"` aparecem hardcoded em filtros Prisma de diferentes adapters, sem enum/tipo central garantindo exclusividade e refactor-safety.
- evidencia.arquivo_ou_area: packages/business/sales/adapters/prisma-sale-repository.ts:88-96,124-131 (e outros)
- impacto.tecnico: Adicionar novo status exige caçar todos os filtros; bug silencioso se filtro esquecido

### [medio] ACH-014 — Acesso a `process.env` disperso sem camada de configuração tipada

- dominio: codigo-manutenibilidade
- run: 2026-04-18_21-45-58 (finalized)
- categoria: configuracao
- status: confirmado
- resumo: 22+ leituras de `process.env.*` em apps/api, apps/worker, apps/web. Padrão `process.env.X ?? 'default'` replicado sem validação centralizada (Zod/env-schema).
- evidencia.arquivo_ou_area: apps/api/src/lib/redis.ts:5; apps/worker/src/index.ts:96; apps/api/src/routers/health.ts; apps/worker/src/health-server.ts; ...
- impacto.tecnico: Difícil descobrir onde um timeout/flag é lido; ausência de validação permite boot com config errada

### [medio] ACH-015 — `cacheInvalidatePattern` sem batching/backpressure em Redis SCAN

- dominio: codigo-manutenibilidade
- run: 2026-04-18_21-45-58 (finalized)
- categoria: complexidade-e-risco-de-manutencao
- status: confirmado
- resumo: Loop aninhado `for await (const keys of stream) { for (const key of keys) pipeline.del(key) }` acumula milhares de comandos em pipeline único sem limite antes do `exec()`.
- evidencia.arquivo_ou_area: apps/api/src/lib/cache.ts:113-134
- impacto.tecnico: Em tenant grande, pipeline pode estourar timeout ou memória do worker Redis

### [medio] ACH-016 — Comunicação inter-módulo sem domain events — poucas filas BullMQ

- dominio: codigo-manutenibilidade
- run: 2026-04-18_21-45-58 (finalized)
- categoria: modularidade
- status: confirmado
- resumo: `apps/api/src/lib/queues.ts` expõe apenas 3 filas (analytics, campaigns, messaging). Não há eventos de domínio (ex.: `ClientCreated`, `SaleConfirmed`) publicados cruzando módulos business. Módulos acoplam-se via chamadas diretas.
- evidencia.arquivo_ou_area: apps/api/src/lib/queues.ts:1-31; ausência de publishers em use-cases clientes/vendas
- impacto.tecnico: Acoplamento forte entre módulos; mudanças em um módulo disparam refactor em consumidores síncronos

### [medio] ACH-018 — Ausência de mapper testável de erros de domínio → HTTP/tRPC

- dominio: codigo-manutenibilidade
- run: 2026-04-18_21-45-58 (finalized)
- categoria: analisabilidade
- status: confirmado
- resumo: Erros de domínio (`DuplicatePhoneError`, `InvalidClientDataError`, etc.) são lançados, mas não há função pura que os mapeia para `TRPCError` com status/code/mensagem padronizados. Conversão é implícita no error handler global.
- evidencia.arquivo_ou_area: packages/business/clients/domain/errors.ts; apps/api/src/trpc/trpc.ts:51-61 (domainErrorMiddleware sem mapper explícito por tipo)
- impacto.tecnico: Difícil testar mapeamento; mudança de mensagem pode afetar consumidores sem aviso

### [medio] ACH-018 — Rate-limit assimétrico e frouxo nos endpoints sensíveis

- dominio: seguranca
- run: 2026-04-18_22-06-18 (finalized)
- categoria: protecao-operacional
- status: confirmado
- resumo: `PUBLIC_LIMIT = 30/min`, `PROTECTED_LIMIT = 100/min`, sem limites específicos por rota sensível (login, reset, invite accept). Identificador público cai para `'anonymous'` — todos os anônimos compartilham a mesma bucket.
- evidencia.arquivo_ou_area: apps/api/src/trpc/rate-limit-middleware.ts:9-37; apps/api/src/trpc/trpc.ts:67
- impacto.tecnico: Brute-force e enumeração continuam viáveis

### [medio] ACH-019 — Email do usuário registrado em logs de falha de autenticação

- dominio: seguranca
- run: 2026-04-18_22-06-18 (finalized)
- categoria: exposicao-de-dados
- status: confirmado
- resumo: `apps/web/src/lib/auth.config.ts:40` inclui o email bruto no campo `detail` do evento de login falho.
- evidencia.arquivo_ou_area: apps/web/src/lib/auth.config.ts:40
- impacto.tecnico: PII em logs estruturados

### [medio] ACH-020 — `security-logger` sem redaction de `phone`, `userId`, `tenantId`

- dominio: seguranca
- run: 2026-04-18_22-06-18 (finalized)
- categoria: exposicao-de-dados
- status: confirmado
- resumo: `packages/shared/src/security-logger.ts` serializa os campos inteiros para stdout.
- evidencia.arquivo_ou_area: packages/shared/src/security-logger.ts:22-44
- impacto.tecnico: PII aparecendo em logs centralizados

### [medio] ACH-021 — Sentry captura erros sem `beforeSend` para redactar PII

- dominio: seguranca
- run: 2026-04-18_22-06-18 (finalized)
- categoria: exposicao-de-dados
- status: confirmado
- resumo: `apps/api/src/lib/sentry.ts` inicializa Sentry com sampling, mas sem hook `beforeSend` que redacte e-mails, tokens JWT e payloads.
- evidencia.arquivo_ou_area: apps/api/src/lib/sentry.ts:10-14; apps/web/sentry.server.config.ts:6
- impacto.tecnico: PII e possivelmente segredos saem para serviço terceiro

### [medio] ACH-022 — `console.error` em adapter WhatsApp pode logar headers/payloads

- dominio: seguranca
- run: 2026-04-18_22-06-18 (finalized)
- categoria: exposicao-de-dados
- status: confirmado
- resumo: `whatsapp-n2-adapter.ts` usa `console.error` com detalhes de requisição/resposta em vez do logger central. Risco de escapar tokens.
- evidencia.arquivo_ou_area: packages/business/messaging/adapters/whatsapp-n2-adapter.ts:75,91
- impacto.tecnico: Dados sensíveis podem vazar em stdout

### [medio] ACH-023 — Endpoint `health.ready` público expõe estado interno detalhado

- dominio: seguranca
- run: 2026-04-18_22-06-18 (finalized)
- categoria: protecao-operacional
- status: confirmado
- resumo: `apps/api/src/routers/health.ts:35-89` devolve detalhes de DB, Redis e outbox-lag sem autenticação. Útil para K8s, mas expõe informação a reconhecedor externo.
- evidencia.arquivo_ou_area: apps/api/src/routers/health.ts:35-89
- impacto.tecnico: Facilita mapeamento de arquitetura e estimativa de alvos para DoS

### [medio] ACH-024 — Trilha de auditoria limitada — eventos críticos não persistidos em banco

- dominio: seguranca
- run: 2026-04-18_22-06-18 (finalized)
- categoria: auditoria
- status: confirmado
- resumo: O `security-logger` cobre OTP e alguns eventos RBAC, mas não persiste login bem-sucedido (IP/UA), mudança de senha, aceitação de invite, remoção de membro, mudança de role, criação/revogação de token. Saída vai apenas para stdout.
- evidencia.arquivo_ou_area: packages/shared/src/security-logger.ts; ausência de modelo `AuditLog` em `packages/db/prisma/schema.prisma`
- impacto.tecnico: Forense inviável após incidente

### [medio] ACH-025 — Postgres sem separação de roles (app vs admin vs migrations)

- dominio: seguranca
- run: 2026-04-18_22-06-18 (finalized)
- categoria: iam
- status: confirmado
- resumo: `docker-compose.prod.yml` usa `POSTGRES_USER=wbc` para app web, worker e provavelmente migrations. Não há role `wbc_app` limitada a SELECT/INSERT/UPDATE/DELETE em tabelas da aplicação.
- evidencia.arquivo_ou_area: docker-compose.prod.yml:8,48,77; .env.production.example:5-6
- impacto.tecnico: SQL injection ou vulnerabilidade na app leva a acesso total ao banco

### [medio] ACH-026 — Containers Docker sem `--read-only`/cap-drop e sem chown final

- dominio: seguranca
- run: 2026-04-18_22-06-18 (finalized)
- categoria: hardening-runtime
- status: confirmado
- resumo: `deploy/Dockerfile.web` e `Dockerfile.worker` criam usuário não-root (bom), mas `docker-compose.prod.yml` não define `read_only: true`, `cap_drop: [ALL]` ou `security_opt: [no-new-privileges]`. Diretórios do app não têm `chown` final garantido.
- evidencia.arquivo_ou_area: deploy/Dockerfile.web:36-42; deploy/Dockerfile.worker:36-42; docker-compose.prod.yml
- impacto.tecnico: Containers comprometidos retêm mais capacidade do que o necessário

### [medio] ACH-027 — `.env` de desenvolvimento usa `AUTH_SECRET` fraco e previsível

- dominio: seguranca
- run: 2026-04-18_22-06-18 (finalized)
- categoria: configuracao-sensivel
- status: confirmado
- resumo: O arquivo `.env` local contém `AUTH_SECRET="wbc-dev-secret-change-in-production-2026"`. Embora `.env` não esteja em `git ls-files` (verificado), o hábito de usar segredos fracos em dev tende a vazar para staging.
- evidencia.arquivo_ou_area: .env:3 (AUTH_SECRET)
- impacto.tecnico: Compartilhamento acidental com staging/prod cria backdoor de assinatura JWT

### [baixo] ACH-009 — Filtros e ordenação sem convenção de nomenclatura entre routers

- dominio: apis-integracoes
- run: 2026-04-18_22-30-59 (finalized)
- categoria: contrato-de-api
- status: confirmado
- resumo: Clients usa `search`, `classification`, `tagIds`, `isLead`; sales usa `status`, `clientId`; finance usa `category`. Nenhum tem `sort`. Não há convenção documentada.
- evidencia.arquivo_ou_area: apps/api/src/routers/clients.ts:22; sales.ts:27; finance.ts:25
- impacto.tecnico: SDK precisa hardcode por rota

### [baixo] ACH-003 — Decisão de monorepo Turborepo + pnpm workspaces não registrada em ADR

- dominio: arquitetura
- run: 2026-04-18_18-17-50 (finalized)
- categoria: arquitetura-declarada
- status: aberto
- resumo: O projeto usa pnpm workspaces + Turborepo (visível em `package.json`, `pnpm-workspace.yaml`, `turbo.json`), mas não há ADR justificando a escolha, documentando os trade-offs frente a polirepo/multirepo, nem as regras de workspace (quando criar novo package, quando promover código compartilhado, convenção de nomes).
- evidencia.arquivo_ou_area: wbc/turbo.json, wbc/package.json, wbc/pnpm-workspace.yaml, wbc/docs/adr/
- impacto.tecnico: Novos devs desconhecem a razão da estrutura; risco de decisões incoerentes de build/deploy/versionamento por falta de referência. Pode dificultar justificativa técnica em revisão arquitetural.

### [baixo] ACH-013 — Estratégia de escalabilidade horizontal de workers sem ADR

- dominio: arquitetura
- run: 2026-04-18_18-17-50 (finalized)
- categoria: decisao-sem-adr
- status: aberto
- resumo: A separação API/Worker em containers distintos (evidenciada em `docker-compose.prod.yml`) permite deploy independente e suporta múltiplos workers BullMQ. Porém, não há ADR documentando estratégia de escalabilidade horizontal: escalar 1 worker pool único vs workers especializados por tipo de job, job affinity, particionamento de queue por tenant, limites de pool Prisma por worker.
- evidencia.arquivo_ou_area: wbc/apps/worker/, wbc/docker-compose.prod.yml, wbc/docs/adr/
- impacto.tecnico: Escalar hoje é possível mas exige engenharia manual; decisões improvisadas podem diluir throughput (ex: 2 workers no mesmo queue sem particionamento).

### [baixo] ACH-017 — Analytics `getDashboard()` como god function com múltiplas queries e resultado monolítico

- dominio: codigo-manutenibilidade
- run: 2026-04-18_21-45-58 (finalized)
- categoria: coesao-de-funcao
- status: confirmado
- resumo: `packages/business/analytics/adapters/prisma-analytics-repository.ts:18-70` executa 4 queries agregadas em `Promise.all` e retorna objeto único; campo `alerts` hardcoded `[]`; impede cache granular.
- evidencia.arquivo_ou_area: packages/business/analytics/adapters/prisma-analytics-repository.ts:18-70
- impacto.tecnico: Não dá para cachear métricas individualmente; mudança em uma métrica recompila tudo

### [baixo] ACH-019 — Comentários em caminhos críticos descrevem O QUÊ, não o PORQUÊ

- dominio: codigo-manutenibilidade
- run: 2026-04-18_21-45-58 (finalized)
- categoria: documentacao-de-codigo
- status: confirmado
- resumo: Comentários em `apps/api/src/lib/cache.ts:13-32` descrevem lazy-init sem explicar razão do isolamento tenant-scoped. Referências opacas a "ACH-012" do repo de origem.
- evidencia.arquivo_ou_area: apps/api/src/lib/cache.ts:13-32
- impacto.tecnico: Onboarding lento; risco de uso incorreto de `getRedis()` vs `getTenantScopedRedis()`

### [baixo] ACH-020 — Estilo misto (classe vs função) para use-cases sem critério documentado

- dominio: codigo-manutenibilidade
- run: 2026-04-18_21-45-58 (finalized)
- categoria: convencao
- status: confirmado
- resumo: Alguns use-cases são classes com método `execute()` (auth), outros são funções assíncronas puras (clients/messaging). Sem regra declarada, padrão depende de quem escreveu.
- evidencia.arquivo_ou_area: packages/business/auth/use-cases/* versus packages/business/clients/use-cases/manage-tags.ts
- impacto.tecnico: Pattern matching do time varia; templates novos herdam ambos os estilos

### [baixo] ACH-022 — Duplicação de helper `getRedis()` entre adapter de auth e lib de api

- dominio: codigo-manutenibilidade
- run: 2026-04-18_21-45-58 (finalized)
- categoria: duplicacao
- status: confirmado
- resumo: `packages/business/auth/adapters/prisma-otp-repository.ts:11-16` define `getRedis()` local; `apps/api/src/lib/redis.ts` define outro. Dois singletons Redis potenciais.
- evidencia.arquivo_ou_area: packages/business/auth/adapters/prisma-otp-repository.ts:11-16; apps/api/src/lib/redis.ts
- impacto.tecnico: Vazamento de conexão em produção; comportamento inconsistente

### [baixo] ACH-028 — Ausência de validador forte para números de telefone

- dominio: seguranca
- run: 2026-04-18_22-06-18 (finalized)
- categoria: validacao-de-entrada
- status: confirmado
- resumo: Schemas aceitam `z.string().min(10).max(15)` sem formato E.164 nem regex; strings como `"0000000000"` ou não-numéricas passam.
- evidencia.arquivo_ou_area: packages/validators/src/auth.ts:8,16,28; packages/validators/src/clients.ts
- impacto.tecnico: Dados lixo em base; integrações com WhatsApp/SMS falham

### [informativo] ACH-021 — Importações relativas profundas em vez dos aliases `@wbc/*`

- dominio: codigo-manutenibilidade
- run: 2026-04-18_21-45-58 (finalized)
- categoria: convencao
- status: confirmado
- resumo: Alguns routers importam via `../../../../packages/business/...` enquanto `tsconfig.json` define aliases `@wbc/*`.
- evidencia.arquivo_ou_area: apps/api/src/routers/clients.ts:4-5 (imports relativos profundos)
- impacto.tecnico: Baixo; quebra só em moves agressivos
