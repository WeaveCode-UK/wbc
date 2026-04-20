# Progresso da Correção

## Identificação
- dominio: codigo-manutenibilidade
- run_id: 2026-04-18_21-45-58
- branch: fix/codigo-manutenibilidade/2026-04-18_21-45-58
- data_inicio: 2026-04-20 19:05:00
- ultima_atualizacao: 2026-04-20 22:10:00
- fase_atual: revisor
- status: em_andamento

## Resumo de Progresso
- total_aprovados: 20
- corrigidos_executor: 20
- revisados_revisor: 20
- corrigidos_pelo_revisor: 5
- ja_resolvidos_por_outra_run: 2
- nao_corrigiveis: 0
- nao_aprovados: 0
- pendentes: 0

## Commits do Revisor (intervenção adicional)
- ddc624d — review-fix(auditoria): ACH-009 — Prisma.*GetPayload no prisma-sale-repository
- 99da797 — review-fix(auditoria): ACH-004 — ESLint warn contra z.object inline em routers
- abe9e4a — review-fix(auditoria): ACH-012 — analytics/sales usam COMPLETED_SALE_STATUSES
- 33bd39c — review-fix(auditoria): ACH-007 — usar resolveWorkspaceMembership no callback jwt
- bcba1b8 — review-fix(auditoria): ACH-002 — barrels catalog/inventory/messaging/sales escondem adapters

## Mapa commit_executor por achado (Fase Executor concluída)
- ACH-010: 3deb49a — packages/shared/src/constants/timings.ts
- ACH-019: 15e44cd — comentários WHY em cache.ts
- ACH-022: ed9adeb — PrismaOtpRepository recebe RedisLike via construtor
- ACH-020: b191603 — CLAUDE.md convenção de use-case
- ACH-021: 00f8920 — ESLint no-restricted-imports + normaliza clients.ts
- ACH-009: aaf7fc7 — IdempotencyRedis interface explícita
- ACH-004: 401646c — clients router reusa schemas de @wbc/validators
- ACH-012: bfa694d — enum SaleStatus/PaymentMethod centralizado
- ACH-015: 7f1b2a0 — chunk pipeline Redis SCAN (lotes de 500)
- ACH-017: 7b8cf73 — dividir getDashboard em métodos por métrica
- ACH-018: 9e36cf4 — mapper domain-error → tRPC expandido
- ACH-007: 8bf5e25 — extrai resolveWorkspaceMembership
- ACH-013: 6dc3e91 — sementar bootstrap() async no worker (parcial)
- ACH-003: a153f1c — composition-root.ts com getRepositories() (parcial)
- ACH-006: 863477d — doc de follow-up PrismaClient via constructor (parcial)
- ACH-002: 2a91b02 — barrels auth/clients expõem só domain/ports
- ACH-005: 6dcaaa0 — subpath exports em @wbc/shared + SPLIT.md (parcial)
- ACH-011: 3ecbfe0 — pickFields/pickDefinedFields helpers (parcial)
- ACH-008: d8ab37c — doc split plan auth.ts (parcial)
- ACH-016: cd08a76 — doc padrão domain events (parcial)

## Achados

### ACH-001
- titulo: TODOs críticos em auth — token storage, email sender e reset não implementados
- severidade: critico
- classificacao: ja_resolvido_por_outra_run
- status_executor: nao_aplicavel
- status_revisor: nao_aplicavel
- commit_executor: 5d3072c (run seguranca/2026-04-18_22-06-18)
- commit_revisor: none
- observacoes: Resolvido pelo fix ACH-001 da correção de seguranca — AuthTokenStore (Redis one-shot), RedisAuthTokenStore adapter, request/reset password e email-verification reescritos, ResendEmailSender real com requireEnv em produção.

### ACH-014
- titulo: Acesso a process.env disperso sem camada de configuração tipada
- severidade: medio
- classificacao: ja_resolvido_por_outra_run
- status_executor: nao_aplicavel
- status_revisor: nao_aplicavel
- commit_executor: 491192b (run seguranca/2026-04-18_22-06-18)
- commit_revisor: none
- observacoes: Resolvido pelo fix ACH-012 da correção de seguranca — packages/shared/src/env.ts ganhou validateEnv estendido com REQUIRED_IN_PRODUCTION, authSecretSchema com min(32) + refusal de padrões fracos, e helper requireEnv(name). Adapters DeepSeek e WhatsApp-N2 passaram a chamar requireEnv em produção.

### ACH-010
- titulo: Números mágicos espalhados para TTLs, intervalos, janelas e thresholds
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 3deb49a
- commit_revisor: none
- resultado_revisao: timings.ts centralizado cobre outbox poll (5s), cleanup (24h), dlq scan (60s), cache TTLs, rate-limit windows, session/lockout. cache.ts, rate-limit-middleware.ts e worker/index.ts consomem as constantes. WORKER_SHUTDOWN_TIMEOUT_MS ficou como fallback do env, conservando override operacional.
- observacoes: none

### ACH-022
- titulo: Duplicação de helper getRedis() entre adapter de auth e lib de api
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: ed9adeb
- commit_revisor: none
- resultado_revisao: getRedis() local do prisma-otp-repository removido. Adapter agora recebe RedisLike via construtor; composition-root instancia com getRedis() convertido (composition-root.ts:75). Duplicação eliminada. Pequena dívida local: usa `as unknown as { incr }` para expor incr (não faz parte de RedisLike) — aceitável e local.
- observacoes: none

### ACH-019
- titulo: Comentários em caminhos críticos descrevem O QUÊ, não o PORQUÊ
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 15e44cd
- commit_revisor: none
- resultado_revisao: cache.ts agora explica lazy-init (motivo: manter test bootstrap barato) e por que getTenantScopedRedis() é obrigatório (prevenção de vazamento cross-tenant). Referência opaca a "ACH-012" removida.
- observacoes: none

### ACH-020
- titulo: Estilo misto (classe vs função) para use-cases sem critério documentado
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: b191603
- commit_revisor: none
- resultado_revisao: CLAUDE.md agora contém seção "Convenção de use-cases" que fixa classe com execute como padrão e descreve quando função pura é aceitável. Cita composition-root como origem das dependências. Exatamente o que a recomendação pediu.
- observacoes: none

### ACH-021
- titulo: Importações relativas profundas em vez dos aliases @wbc/*
- severidade: informativo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 00f8920
- commit_revisor: none
- resultado_revisao: ESLint passou a ter no-restricted-imports (warn, patterns ../../../* e ../../../../*) com mensagem prescrevendo @wbc/*. apps/api/src/routers/clients.ts (arquivo citado pela evidência) foi normalizado para usar @wbc/business/* e @wbc/validators. Tightening warn→error fica como follow-up documentado no próprio ESLint config.
- observacoes: none

### ACH-009
- titulo: Type casting `as unknown as X` em mappers Prisma e Redis sem justificativa
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: corrigido_com_revisao
- commit_executor: aaf7fc7
- commit_revisor: ddc624d
- discrepancia_encontrada: Executor resolveu apenas idempotency-middleware.ts via interface IdempotencyRedis. O achado lista 8+ ocorrências citando explicitamente prisma-sale-repository.ts:11-27,40-42,66,113,133 — que ficaram intocadas com `as unknown as Record<string, unknown>`.
- correcao_aplicada: review-fix ddc624d adiciona Prisma.SaleGetPayload e Prisma.SaleGetPayload<{ include: { items: true } }> em prisma-sale-repository.ts, substituindo 6 casts opacos nos mappers e parametrizando paginatedQuery<PrismaSale>.
- observacoes: none

### ACH-012
- titulo: Literais de status/enum espalhados em filtros Prisma
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: corrigido_com_revisao
- commit_executor: bfa694d
- commit_revisor: abe9e4a
- discrepancia_encontrada: Executor criou sales/domain/status.ts com SALE_STATUSES, COMPLETED_SALE_STATUSES e PaymentMethod, mas deixou 8 call sites do analytics repo com `status: { in: ["CONFIRMED","DELIVERED"] }` (incluindo a variante `as const` que era a evidência do achado) e o create do sale repo com o union de métodos de pagamento inline.
- correcao_aplicada: review-fix abe9e4a troca todas as 8 ocorrências no prisma-analytics-repository.ts por `COMPLETED_SALE_STATUSES` e o create do prisma-sale-repository.ts passa a usar `data.paymentMethod as PaymentMethod | undefined`.
- observacoes: none

### ACH-004
- titulo: Schemas Zod duplicados entre packages/validators e routers inline
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: corrigido_com_revisao
- commit_executor: 401646c
- commit_revisor: 99da797
- discrepancia_encontrada: Executor normalizou apenas clients.ts (evidência canônica do achado), mas a recomendação pedia explicitamente "regra ESLint para proibir z.object em apps/api/src/routers/*". 13 routers ainda têm z.object inline.
- correcao_aplicada: review-fix 99da797 adiciona no-restricted-syntax (warn) no eslint.base.mjs com override para apps/api/src/routers/**/*.ts, barrando CallExpression z.object. Warn em vez de error para não bloquear CI — tighten warn→error é follow-up documentado no próprio override após normalização dos demais routers.
- observacoes: none

### ACH-018
- titulo: Ausência de mapper testável de erros de domínio → HTTP/tRPC
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 9e36cf4
- commit_revisor: none
- resultado_revisao: mapDomainErrorToTRPC(error) em error-handler.ts é função pura com 6 tabelas por tipo (NOT_FOUND, BAD_REQUEST, CONFLICT, TOO_MANY_REQUESTS, UNAUTHORIZED, INTERNAL_SERVER_ERROR). Retorna TRPCError ou null para fallthrough genérico. Comentário WHY explica design e cita origens (seguranca run ACH-001/ACH-004). Testável em isolado e estende facilmente.
- observacoes: none

### ACH-002
- titulo: index.ts de packages/business expõe adapters e use-cases sem barreira
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: corrigido_com_revisao
- commit_executor: 2a91b02
- commit_revisor: bcba1b8
- discrepancia_encontrada: Executor tratou apenas auth e clients, mas a evidência do achado lista 7 barrels. Catalog, inventory, messaging e sales continuavam re-exportando ./adapters/*.
- correcao_aplicada: review-fix bcba1b8 normaliza os 4 barrels restantes para expor apenas domain + ports (+ status em sales). Busca de importers via `@wbc/business/<modulo>` (barrel) confirmou zero call-sites impactados. Schedule já não exportava adapters.
- observacoes: none

### ACH-007
- titulo: Callback jwt em auth.config.ts com lógica complexa e estado mutável
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: corrigido_com_revisao
- commit_executor: 8bf5e25
- commit_revisor: 33bd39c
- discrepancia_encontrada: Executor criou resolve-workspace-membership.ts com a discriminated union { onboarding | selection | ready } mas não atualizou auth.config.ts — o callback jwt continuava idêntico, com if/else em cadeia nas ~50 linhas originais da evidência do achado.
- correcao_aplicada: review-fix 33bd39c faz auth.config.ts consumir resolveWorkspaceMembership() no callback jwt: computa `preferred` (tid existente do token OU novo tid vindo de session.update), delega ao helper e aplica o estado via switch sobre state.kind. O bloco duplicado `trigger === "update"` foi removido (agora coberto pelo mesmo caminho). Semântica preservada; bônus: tid órfão (workspace removido) agora força nova seleção em vez de ficar travado.
- observacoes: none

### ACH-008
- titulo: Router auth.ts com 391 linhas e 17 procedures heterogêneas
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido_parcial
- status_revisor: aprovado
- commit_executor: d8ab37c
- commit_revisor: none
- resultado_revisao: Comentário no topo de apps/api/src/routers/auth.ts descreve o split target em 5 sub-routers (signup, session, invites, otp, account) com barrel enxuto. Justifica o deferimento (conflitos com trabalho auth concorrente). Parcial só-doc autorizado.
- observacoes: Parcial só-doc autorizado — split real é follow-up em branch dedicada.

### ACH-013
- titulo: Side-effects pesados no entry-point ao importar módulos
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido_parcial
- status_revisor: aprovado
- commit_executor: 6dc3e91
- commit_revisor: none
- resultado_revisao: Skeleton `export async function bootstrap()` adicionado em apps/worker/src/index.ts, com comentário explicando por que o refactor completo (mover side-effects para dentro da função + guard isEntryPoint) foi deferido como follow-up grande e risco. Parcial honesto conforme autorizado no escopo da run.
- observacoes: Parcial intencional — refactor completo do entry-point é follow-up.

### ACH-015
- titulo: cacheInvalidatePattern sem batching/backpressure em Redis SCAN
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 7f1b2a0
- commit_revisor: none
- resultado_revisao: cache.ts agora chunkara DELs em lotes de INVALIDATE_BATCH_SIZE=500, reabrindo pipeline a cada flush, mantendo totalDeleted para log. Backpressure real (pipelines pequenos em sequência) e observabilidade (debug log com totalDeleted). Cobre linhas 113-134 da evidência.
- observacoes: none

### ACH-003
- titulo: Ausência de composition root — repositórios instanciados como singletons no topo dos routers
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido_parcial
- status_revisor: aprovado
- commit_executor: a153f1c
- commit_revisor: none
- resultado_revisao: apps/api/src/composition-root.ts criado com interface Repositories (13 adapters: auth, clients, services), getRepositories() factory cached e resetCompositionRootForTesting(). Comentário topo documenta que adoção em N routers é follow-up ligado a ACH-006 (PrismaClient via constructor). Parcial autorizado.
- observacoes: Parcial intencional — adoção router-a-router é follow-up.

### ACH-006
- titulo: Singleton global de PrismaClient em packages/db sem contrato de ciclo de vida
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido_parcial
- status_revisor: aprovado
- commit_executor: 863477d
- commit_revisor: none
- resultado_revisao: Doc de follow-up adicionada ao prisma-client-repository.ts descrevendo target shape (`constructor(private readonly db: PrismaClient)`) e remetendo ao composition-root (ACH-003) como ponto de injeção. Parcial só-doc autorizado — migração dos 10+ adapters e N call-sites em paralelo é refactor grande.
- observacoes: Parcial só-doc — migração prisma injetado fica como follow-up amarrado ao composition-root.

### ACH-011
- titulo: Duplicação de mapeamento entidade↔Prisma em múltiplos adapters
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido_parcial
- status_revisor: aprovado
- commit_executor: 3ecbfe0
- commit_revisor: none
- resultado_revisao: packages/shared/src/mappers/base.ts traz pickFields e pickDefinedFields (genéricos tipados); barrel re-exporta. Comentário do arquivo documenta que BaseMapper<TDomain,TPersistence> fica como follow-up per-entidade — exatamente o parcial autorizado.
- observacoes: Parcial autorizado — BaseMapper class per-entidade é follow-up.

### ACH-005
- titulo: packages/shared é saco de utilitários incoeso
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido_parcial
- status_revisor: aprovado
- commit_executor: 6dcaaa0
- commit_revisor: none
- resultado_revisao: packages/shared/package.json ganhou 11 subpath exports (sentry-redaction, logger, redaction, env, theme, constants/timings, events, redis, resilience, circuit-breaker) habilitando tree-shaking imediato por área. SPLIT.md descreve plano de split em 4 pacotes (design-tokens, shared-resilience, shared-events, shared-types) com mapeamento de origem→destino e passos do refactor. Parcial autorizado — migração física dos arquivos fica como follow-up.
- observacoes: Parcial autorizado — split real em 4 pacotes é follow-up (SPLIT.md).

### ACH-016
- titulo: Comunicação inter-módulo sem domain events
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido_parcial
- status_revisor: aprovado
- commit_executor: cd08a76
- commit_revisor: none
- resultado_revisao: packages/shared/src/events/README.md documenta contrato (past-tense, module-prefixed, idempotência, tenantId explícito), exemplos publish/subscribe usando EVENTS constant, e lista canônica de eventos por módulo (sales, clients, inventory, catalog, schedule, finance, messaging, campaigns). Parcial só-doc autorizado — cabeamento em cada use-case fica como follow-up.
- observacoes: Parcial só-doc autorizado — migração dos use-cases para publishEvent() é follow-up.

### ACH-017
- titulo: Analytics getDashboard() god function
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 7b8cf73
- commit_revisor: none
- resultado_revisao: getDashboard foi convertido em composição de quatro métodos por métrica (getMonthlySalesCount, getMonthlyRevenue, getPendingRemindersCount, getUpcomingAppointmentsCount). monthBounds helper extraído. Cada método agora pode ser cacheado individualmente, exatamente o que a recomendação pediu.
- observacoes: none
