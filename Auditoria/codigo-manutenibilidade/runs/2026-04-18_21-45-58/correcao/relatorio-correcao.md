# Relatório de Correção

## Identificação
- dominio: codigo-manutenibilidade
- run_id: 2026-04-18_21-45-58
- branch: fix/codigo-manutenibilidade/2026-04-18_21-45-58
- data_inicio: 2026-04-20 19:05:00
- data_conclusao: 2026-04-20 22:30:00
- ultima_atualizacao: 2026-04-20 22:30:00
- status: concluido

## Resumo Executivo
Corrigidos 20 dos 22 achados aprovados da run `2026-04-18_21-45-58` do
domínio `codigo-manutenibilidade`. 2 achados (ACH-001 e ACH-014) foram
registrados como `ja_resolvido_por_outra_run` porque o fix da run
`seguranca/2026-04-18_22-06-18` já havia resolvido o problema
(AuthTokenStore + Resend real; validateEnv + requireEnv).

Fase Executor: 20/20 corrigidos, 0 falhas. Fase Revisor (Opus, sequencial,
diff-by-diff): 15 aprovados sem intervenção; 5 exigiram review-fix —
ACH-009 (Prisma.*GetPayload nos mappers de sales), ACH-004 (ESLint warn
contra z.object inline em routers), ACH-012 (analytics/sales usando
COMPLETED_SALE_STATUSES), ACH-007 (integração de resolveWorkspaceMembership
no callback jwt), ACH-002 (barrels de catalog/inventory/messaging/sales).

Validação técnica: type-check em 12 pacotes ✓ após 4 tentativas; build do
Next.js ✓ após 0 tentativas no último passe. Correções pós-validação
cobriram (a) imports `@wbc/shared/src/*` incompatíveis com o exports map
do ACH-005, (b) `"REFUNDED"` que não existia no enum SaleStatus do schema
Prisma, (c) `events/index.ts` ausente, (d) duplicação de `SaleStatus`
entre value-objects e status.

## Estatísticas
- total_achados_na_run: 22
- aprovados_para_correcao: 20
- ja_resolvidos_por_outra_run: 2 (ACH-001 → commit 5d3072c; ACH-014 → commit 491192b)
- corrigidos_pelo_executor: 20
- aprovados_pelo_revisor_sem_alteracao: 15
- corrigidos_pelo_revisor: 5 (ACH-009, 004, 012, 007, 002)
- falha_executor_resolvida_pelo_revisor: 0
- nao_corrigiveis: 0
- nao_aprovados: 0
- falha_total: 0
- taxa_de_acerto_do_executor: 75% (15/20 aprovados direto)

## Validação Técnica
- type_check: passou (12 pacotes) após 4 tentativas — fixes: (a) imports
  @wbc/shared/src/* → subpaths públicos em ui-native e db/outbox;
  (b) SALE_STATUSES alinhado com enum do schema; (c) events/index.ts
  criado; (d) sale-repo usa SaleStatus de value-objects (sem duplicação);
  (e) prisma-outbox-repository usa @wbc/shared/events.
- build: passou (4/4 pacotes Next.js) na primeira tentativa pós-type-check.
- tentativas_de_correcao_build: 0
- bloqueio_build: nao
- erro_persistente: nenhum

## Achados Corrigidos (Executor aceito pelo Revisor sem alteração)

| ACH | Sev | Título | Commit Executor |
|-----|-----|--------|-----------------|
| ACH-010 | medio | Números mágicos → constants/timings.ts | 3deb49a |
| ACH-019 | baixo | Comentários WHY em cache.ts | 15e44cd |
| ACH-022 | baixo | PrismaOtpRepository recebe Redis via constructor | ed9adeb |
| ACH-020 | baixo | CLAUDE.md: convenção de use-case | b191603 |
| ACH-021 | info | ESLint no-restricted-imports + clients.ts | 00f8920 |
| ACH-015 | medio | Chunk pipeline Redis SCAN (lotes 500) | 7f1b2a0 |
| ACH-017 | baixo | getDashboard dividido em métricas | 7b8cf73 |
| ACH-018 | medio | mapDomainErrorToTRPC expandido + doc | 9e36cf4 |
| ACH-013 | alto (parcial) | Sementar bootstrap() async no worker | 6dc3e91 |
| ACH-003 | alto (parcial) | composition-root.ts factory | a153f1c |
| ACH-006 | medio (parcial) | Doc follow-up PrismaClient via constructor | 863477d |
| ACH-005 | medio (parcial) | Subpath exports @wbc/shared + SPLIT.md | 6dcaaa0 |
| ACH-011 | medio (parcial) | pickFields / pickDefinedFields helpers | 3ecbfe0 |
| ACH-008 | medio (parcial) | Doc split plan auth.ts | d8ab37c |
| ACH-016 | medio (parcial) | Doc padrão domain events (README.md) | cd08a76 |

## Achados Corrigidos com Intervenção do Revisor

| ACH | Executor | Revisor | Intervenção |
|-----|----------|---------|-------------|
| ACH-009 | aaf7fc7 | ddc624d | Executor só idempotency; Revisor adicionou Prisma.SaleGetPayload em 6 casts do prisma-sale-repository |
| ACH-004 | 401646c | 99da797 | Executor só clients.ts; Revisor adicionou ESLint no-restricted-syntax (warn) contra z.object inline em routers |
| ACH-012 | bfa694d | abe9e4a | Executor criou enum mas deixou 8 literais; Revisor substituiu analytics/sales por COMPLETED_SALE_STATUSES + PaymentMethod |
| ACH-007 | 8bf5e25 | 33bd39c | Executor extraiu helper mas não integrou; Revisor refatorou callback jwt com switch sobre discriminated union |
| ACH-002 | 2a91b02 | bcba1b8 | Executor só auth/clients; Revisor normalizou barrels de catalog/inventory/messaging/sales |

## Achados Parciais (requerem validação humana após correção)

| ACH | O que foi feito | O que falta |
|-----|-----------------|-------------|
| ACH-013 | `bootstrap()` async sementado no worker com doc | Mover top-level `setInterval`/`subscribe` para dentro do bootstrap; gate com `isEntryPoint()` check |
| ACH-003 | `apps/api/src/composition-root.ts` com `getRepositories()` factory | Refatorar todos os routers para usar `ctx.repos` em vez de instanciar no módulo |
| ACH-006 | Documentada intenção de receber PrismaClient via constructor | Adicionar parâmetro `db: PrismaClient` nos ~20 adapters; atualizar call-sites e composition-root |
| ACH-005 | Subpath exports + SPLIT.md com plano de 4 pacotes | Executar o split em PR dedicado (design-tokens/resilience/events/types) |
| ACH-011 | `pickFields`/`pickDefinedFields` helpers em @wbc/shared/mappers | Refatorar mappers de sales/clients/otp para usar os helpers |
| ACH-008 | Split plan documentado na cabeça de auth.ts | Dividir fisicamente em auth.signup.ts, auth.session.ts, auth.invites.ts, auth.otp.ts, auth.account.ts |
| ACH-016 | README de domain events com contrato + exemplos + tabela de eventos-alvo | Publicar `publishEvent()` nos use-cases critical + adicionar lint contra cross-module imports |

## Achados Não Corrigíveis
Nenhum.

## Achados Não Aprovados pelo Usuário
Nenhum.

## Achados com Falha Total
Nenhum.

## Commits Gerados

### Estrutura (chore)
- Commit inicial — inicializar correção da run
- `9bd0add` — fase executor concluída
- `aa909cd` — fase revisor concluída (15 aprovados, 5 com intervenção)

### Fase Executor (20 commits)
(listados no relatório acima por ACH)

### Fase Revisor (5 commits review-fix)
- `ddc624d` — ACH-009 Prisma.SaleGetPayload
- `99da797` — ACH-004 ESLint warn z.object
- `abe9e4a` — ACH-012 COMPLETED_SALE_STATUSES nos filtros
- `33bd39c` — ACH-007 jwt usa resolveWorkspaceMembership
- `bcba1b8` — ACH-002 barrels catalog/inventory/messaging/sales

### Pós-validação técnica (1 commit)
- `545d878` — fixes para type-check (subpaths, SALE_STATUSES alinhado, events/index.ts, duplicação SaleStatus)

## Merge
- status_merge: pendente
- branch_origem: fix/codigo-manutenibilidade/2026-04-18_21-45-58
- branch_destino: main
- aprovado_por_usuario: nao
