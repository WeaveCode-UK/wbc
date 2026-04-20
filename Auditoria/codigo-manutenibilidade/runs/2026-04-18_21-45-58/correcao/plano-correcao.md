# Plano de Correção

## Identificação
- dominio: codigo-manutenibilidade
- run_id: 2026-04-18_21-45-58
- data_geracao: 2026-04-20 19:05:00
- total_achados: 22
- corrigiveis: 16
- corrigiveis_parciais: 4
- nao_corrigiveis: 0
- ja_resolvidos_por_outra_run: 2 (ACH-001 e ACH-014 resolvidos pela correção de seguranca 2026-04-18_22-06-18)

## Ordem de Execução

### 1. ACH-001 — TODOs críticos em auth (token storage, email, reset)
- classificacao: ja_resolvido_por_outra_run
- resolvido_por: run seguranca/2026-04-18_22-06-18 commit 5d3072c
- acao: registrar commit_executor vazio com observação; não gerar novo commit

### 2. ACH-014 — Acesso a process.env disperso sem camada tipada
- classificacao: ja_resolvido_por_outra_run
- resolvido_por: run seguranca/2026-04-18_22-06-18 commit 491192b (validateEnv estendido + requireEnv)
- acao: mesma lógica do ACH-001

### 3. ACH-010 — Números mágicos em TTLs / intervalos
- classificacao: corrigivel
- arquivo: packages/shared/src/constants/timings.ts (novo), apps/worker/src/index.ts, apps/api/src/lib/cache.ts, apps/api/src/trpc/rate-limit-middleware.ts
- acao: criar módulo central com constantes nomeadas; substituir nos principais call sites

### 4. ACH-022 — getRedis duplicado em prisma-otp-repository
- classificacao: corrigivel
- arquivo: packages/business/auth/adapters/prisma-otp-repository.ts
- acao: remover getRedis local, receber Redis via construtor (alinhado com ACH-003)

### 5. ACH-019 — Comentários WHAT em vez de WHY em cache.ts
- classificacao: corrigivel
- arquivo: apps/api/src/lib/cache.ts:13-32
- acao: reescrever comentários para explicar o porquê, remover referência "ACH-012" opaca

### 6. ACH-020 — Convenção mista classe vs função para use-cases
- classificacao: corrigivel
- arquivo: wbc/CLAUDE.md (adicionar convenção)
- acao: documentar regra "use-cases são classes `execute(input)`; funções puras só em helpers"

### 7. ACH-021 — Imports relativos profundos vs aliases @wbc/*
- classificacao: corrigivel
- arquivo: .eslintrc ou eslint.base.mjs; apps/api/src/routers/clients.ts
- acao: regra no-restricted-imports; normalizar imports relativos profundos

### 8. ACH-009 — Casts `as unknown as X` em mappers/idempotency/cache
- classificacao: corrigivel
- arquivo: apps/api/src/trpc/idempotency-middleware.ts, apps/api/src/lib/cache.ts, packages/business/sales/adapters/prisma-sale-repository.ts
- acao: substituir por tipos Prisma.* auto-gerados ou interfaces RedisLike; comentar justificativa onde cast for genuíno

### 9. ACH-012 — Literais de status/enum espalhados em filtros Prisma
- classificacao: corrigivel
- arquivo: packages/business/sales/domain/status.ts (novo), ajustar adapters
- acao: centralizar enum SaleStatus e helper statusIn()

### 10. ACH-004 — Schemas Zod duplicados
- classificacao: corrigivel
- arquivo: apps/api/src/routers/clients.ts (e outros com duplicação)
- acao: importar schemas de @wbc/validators; remover declarações inline

### 11. ACH-018 — Mapper puro domain error → TRPCError
- classificacao: corrigivel
- arquivo: apps/api/src/trpc/error-handler.ts
- acao: expandir mapDomainErrorToTRPC com tabela de correspondência por tipo

### 12. ACH-002 — Barrels de packages/business expõem adapters
- classificacao: corrigivel
- arquivo: packages/business/*/index.ts
- acao: reduzir exports a domain/ e ports/; expor adapters apenas por caminho explícito

### 13. ACH-007 — Callback jwt complexo com estado mutável
- classificacao: corrigivel
- arquivo: apps/web/src/lib/auth.config.ts
- acao: extrair resolveWorkspaceMembership(userId, memberRepo) puro; reduzir callback a orquestração

### 14. ACH-008 — Router auth.ts com 391 linhas e 17 procedures
- classificacao: corrigivel
- arquivo: apps/api/src/routers/auth.ts
- acao: segmentar em auth.session, auth.invites, auth.otp, auth.account; agregador enxuto

### 15. ACH-013 — Side-effects no entry-point
- classificacao: corrigivel
- arquivo: apps/api/src/index.ts, apps/worker/src/index.ts
- acao: mover init para async bootstrap(); guard de execução

### 16. ACH-015 — Redis SCAN sem batching
- classificacao: corrigivel
- arquivo: apps/api/src/lib/cache.ts:113-134
- acao: chunk pipeline a cada 500 dels; timeout explícito; log de volume

### 17. ACH-003 — Composition root (factory mínima)
- classificacao: corrigivel_parcial
- arquivo: apps/api/src/composition-root.ts (novo); auth.ts e demais routers usam ctx.repos
- acao: factory createRepositories(); expor via ctx; atualizar 2-3 routers principais como exemplo

### 18. ACH-006 — PrismaClient via constructor (repos principais)
- classificacao: corrigivel_parcial
- arquivo: packages/business/auth/adapters/*.ts, packages/business/clients/adapters/*.ts
- acao: adapters aceitam PrismaClient opcional no constructor (fallback ao singleton); injetar pela factory do ACH-003

### 19. ACH-011 — BaseMapper/projeção comum
- classificacao: corrigivel_parcial
- arquivo: packages/shared/src/mappers/ (novo), 2 adapters piloto
- acao: criar util pickDomainFields; aplicar em sales/clients

### 20. ACH-005 — @wbc/shared incoeso (split)
- classificacao: corrigivel_parcial
- arquivo: packages/shared/src/index.ts (reorganizar por subpath), ARQUITETURA.md
- acao: criar subpath exports (./events, ./redis, ./theme, ./resilience) sem split de pacote ainda; documentar plano de split

### 21. ACH-016 — Domain events: publishers de exemplo
- classificacao: corrigivel_parcial
- arquivo: 1 use-case de sales + 1 use-case de clients que publique event via outbox; doc em packages/shared/src/events/README.md
- acao: 2 publishers exemplo + documentação do padrão

### 22. ACH-017 — getDashboard() god function
- classificacao: corrigivel (baixa)
- arquivo: packages/business/analytics/adapters/prisma-analytics-repository.ts
- acao: dividir em getRevenue, getSalesCount, getAlerts, getAppointments; compor em getDashboard

## Achados Não Corrigíveis
Nenhum.

## Resumo do Plano
- Total a corrigir: 20 (16 corrigíveis + 4 parciais)
- Já resolvidos por outra run: 2
- Não corrigíveis: 0
- Estimativa de commits: ~22 (20 fix + 2 chore estrutura)
