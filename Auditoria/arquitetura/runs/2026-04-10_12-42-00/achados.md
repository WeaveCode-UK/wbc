# Achados da Auditoria

## Identificação
- dominio: arquitetura
- run_id: 2026-04-10_12-42-00
- ultima_atualizacao: 2026-04-10 12:50:44

## Regras de Registro
- Registrar apenas achados reais com evidência observável.
- Não registrar opinião vaga sem base no repositório.
- Cada achado deve ter ID único dentro da run.
- Cada achado deve pertencer a uma categoria compatível com o domínio atual.
- Cada achado deve ter severidade definida.
- Se o item não for confirmado, registrar como hipótese e explicar a limitação.

## Severidades Permitidas
- critico
- alto
- medio
- baixo
- informativo

## Status Permitidos
- aberto
- confirmado
- mitigado
- resolvido
- aceito
- nao_aplicavel

## Achados Registrados

### ARQ-20260410-001 — Topologia tRPC/API desconectada do runtime web e de producao
- severidade: critico
- status: confirmado
- categoria: boundaries-e-topologia
- fases_relacionadas:
  - Fase 2 — Decomposição Estrutural, Boundaries e Dependências
  - Fase 3 — Decisões Arquiteturais e Sustentação das Qualidades do Sistema
- evidencias:
  - `apps/api/src/trpc/router.ts:19` define `appRouter` com os routers de negocio.
  - `apps/api/src/index.ts:21` a `apps/api/src/index.ts:24` apenas registra logs de inicializacao; nao ha servidor HTTP, `listen`, handler tRPC ou adapter de request.
  - `apps/api/package.json:7` a `apps/api/package.json:10` declara `dev`, `build` e `start` para `@wbc/api`, mas `apps/api/tsconfig.json:4` e `apps/api/tsconfig.json:5` combinam `outDir` com `noEmit: true`, logo o `start` aponta para `dist/index.js` sem emissao pelo build.
  - `docker-compose.prod.yml:37` a `docker-compose.prod.yml:79` possui servicos `web` e `worker`, mas nenhum servico `api`.
  - `deploy/nginx.conf:1` a `deploy/nginx.conf:4` define apenas upstream `web`, e `deploy/nginx.conf:42` a `deploy/nginx.conf:52` encaminha o trafego para esse upstream.
  - `apps/web/src/app/(auth)/onboarding/page.tsx:35`, `apps/web/src/app/(auth)/invite/page.tsx:35`, `apps/web/src/app/(auth)/reset-password/page.tsx:20` e `apps/web/src/app/(auth)/workspace/page.tsx:27` chamam endpoints `/api/trpc/...`, mas `find apps/web/src/app -maxdepth 5 -type f -name "route.ts"` nao encontrou rota `app/api/trpc`.
- impacto:
  - Os routers tRPC existem na base, mas nao ficam expostos por nenhum container, proxy ou route handler confirmado.
  - Fluxos centrais de Auth 2.0 e chamadas de negocio que dependem de `/api/trpc/...` tendem a retornar 404 ou ficarem inacessiveis.
  - A arquitetura declarada como Next.js + tRPC + app API separado nao esta refletida no runtime verificavel.
- recomendacao:
  - Definir explicitamente o boundary de runtime: ou expor `@wbc/api` como servico HTTP real no compose/nginx, ou mover/encapsular o `appRouter` em um route handler Next.js (`apps/web/src/app/api/trpc/[trpc]/route.ts`) com contexto e middleware corretos.
  - Ajustar `build/start` do app API se ele continuar existindo como container separado.

### ARQ-20260410-002 — OutboxPublisher esta inicializado apenas no worker, mas publishers rodam em use-cases chamados pela API
- severidade: alto
- status: confirmado
- categoria: comunicacao-entre-modulos
- fases_relacionadas:
  - Fase 2 — Decomposição Estrutural, Boundaries e Dependências
  - Fase 3 — Decisões Arquiteturais e Sustentação das Qualidades do Sistema
- evidencias:
  - `packages/shared/src/events/event-publisher.ts:5` mantem `outboxPort` global como `null`.
  - `packages/shared/src/events/event-publisher.ts:16` a `packages/shared/src/events/event-publisher.ts:17` lanca erro quando `publish()` e chamado sem `setOutboxPort()`.
  - `apps/worker/src/index.ts:49` e `apps/worker/src/index.ts:50` inicializam `setOutboxPort(new PrismaOutboxRepository())` somente no worker.
  - `packages/business/sales/use-cases/confirm-sale.ts:33` e `packages/business/sales/use-cases/confirm-sale.ts:34` publicam `EVENTS.SALE_CONFIRMED`.
  - `apps/api/src/routers/sales.ts:50` a `apps/api/src/routers/sales.ts:53` chama `confirmSale()` pelo router da API.
  - Busca por `setOutboxPort` em `apps` e `packages` encontrou apenas a inicializacao em `apps/worker/src/index.ts:50`.
- impacto:
  - Use-cases que publicam eventos a partir da API podem falhar antes de registrar o evento no outbox.
  - A comunicacao assíncrona entre modulos fica dependente de uma inicializacao que ocorre no processo consumidor, nao no processo produtor.
  - A decisao arquitetural de outbox perde a garantia de gravar evento junto da operacao de negocio.
- recomendacao:
  - Inicializar o `OutboxPort` no processo que executa use-cases produtores, antes dos routers/procedures atenderem requests.
  - Preferir injecao explicita de publisher/port por composition root, evitando singleton global invisivel entre runtimes.

### ARQ-20260410-003 — RLS declarado exige contexto de sessao no PostgreSQL, mas o middleware Prisma nao seta `app.current_tenant_id`
- severidade: alto
- status: confirmado
- categoria: multi-tenancy-e-isolamento
- fases_relacionadas:
  - Fase 1 — Arquitetura Declarada, Contexto e Escopo
  - Fase 3 — Decisões Arquiteturais e Sustentação das Qualidades do Sistema
- evidencias:
  - `begin/WBC-Auth-2.0-Prompts-Execucao.md:672` exige que o tenant middleware execute `SET LOCAL app.current_tenant_id = $1` antes de cada transacao.
  - `packages/db/prisma/migrations/manual/001_rls_policies.sql:39` a `packages/db/prisma/migrations/manual/001_rls_policies.sql:41` cria policies baseadas em `current_setting('app.current_tenant_id', true)::uuid`.
  - `packages/db/prisma/migrations/manual/002_rls_policies_complement.sql:28` a `packages/db/prisma/migrations/manual/002_rls_policies_complement.sql:30` repete a mesma dependencia para tabelas complementares.
  - `packages/db/src/middleware/tenant-middleware.ts:35` a `packages/db/src/middleware/tenant-middleware.ts:63` injeta `tenantId` nos argumentos Prisma, mas nao executa `SET LOCAL`, `set_config` ou equivalente.
  - Busca por `set_config` e `app.current_tenant_id` em `apps` e `packages` nao encontrou implementacao runtime para setar a variavel de sessao.
  - `find packages/db/prisma/migrations -maxdepth 2 -type f -name migration.sql` retornou apenas `packages/db/prisma/migrations/0_baseline/migration.sql`; as policies RLS estao em `packages/db/prisma/migrations/manual/`.
- impacto:
  - Se as policies RLS forem aplicadas, queries do runtime podem nao enxergar dados porque a variavel de sessao nao e setada.
  - Se as policies manuais nao forem aplicadas no deploy, a camada RLS declarada nao existe no banco, restando apenas filtro aplicacional.
  - A arquitetura de isolamento multi-tenant fica incoerente entre documentacao, migration e runtime.
- recomendacao:
  - Consolidar RLS em migration versionada executada no fluxo normal de deploy.
  - Implementar o set da variavel `app.current_tenant_id` no mesmo boundary transacional usado pelas queries tenant-scoped, ou remover a promessa de RLS e documentar formalmente o isolamento aplicacional.

### ARQ-20260410-004 — ADRs e documentos de referencia ficaram desatualizados frente ao Auth 2.0 e a Fase 10
- severidade: medio
- status: confirmado
- categoria: documentacao-e-decisoes-arquiteturais
- fases_relacionadas:
  - Fase 1 — Arquitetura Declarada, Contexto e Escopo
  - Fase 3 — Decisões Arquiteturais e Sustentação das Qualidades do Sistema
- evidencias:
  - `docs/adr/004-auth-otp-only.md:1` a `docs/adr/004-auth-otp-only.md:13` mantem ADR aceita para autenticacao OTP-only, sem armazenamento de senha.
  - `begin/WBC_FASES_E_EPICOS.md:1253` a `begin/WBC_FASES_E_EPICOS.md:1255` declara Fase 10 Auth 2.0 com Google OAuth e email/senha.
  - `packages/business/auth/domain/entities/account.entity.ts:5` possui `passwordHash`.
  - `apps/web/src/lib/auth.config.ts:1` a `apps/web/src/lib/auth.config.ts:8` configura Google, Credentials, repositories e password hasher.
  - `docs/adr/002-multi-tenant-rls.md:16` afirma "No RLS at database level", enquanto `packages/db/prisma/migrations/manual/001_rls_policies.sql:4` a `packages/db/prisma/migrations/manual/001_rls_policies.sql:23` habilita RLS em varias tabelas.
  - `CLAUDE.md:20` declara termino em `BUILD COMPLETO — WBC Platform v1.0.0`, `CLAUDE.md:56` descreve roadmap de 7 fases, mas `prompts/STATE.json:4` e `prompts/STATE.json:44` registram Fase 10 concluida com tag `v2.0.0-fase-10`.
- impacto:
  - Novas decisoes nao estao refletidas nos ADRs aceitos, criando instrucoes conflitantes para agentes e revisores.
  - A documentacao principal deixa de ser fonte confiavel para entender autenticacao, isolamento e versao alvo do sistema.
  - Correcoes futuras podem reintroduzir arquitetura antiga por seguirem ADRs formalmente aceitas porem obsoletas.
- recomendacao:
  - Supersedar ADR-004 por ADR de Auth 2.0 e atualizar ADR-002 com a decisao real sobre RLS.
  - Atualizar `CLAUDE.md` para refletir a fase/versao atual ou marcá-lo como documento historico.
