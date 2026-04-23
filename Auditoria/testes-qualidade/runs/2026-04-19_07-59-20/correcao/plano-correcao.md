# Plano de Correção

## Identificação
- dominio: testes-qualidade
- run_id: 2026-04-19_07-59-20
- data_geracao: 2026-04-22 01:35:00
- total_achados: 16
- corrigiveis: 4
- corrigiveis_parciais: 12
- nao_corrigiveis: 0

## Restrição crítica do projeto
CLAUDE.md: **"ZERO testes até Fase 7"** e o projeto está na Fase 4. Por isso, todos os ACHs que pedem NOVAS suítes de testes (ACH-001-005, ACH-008-012, ACH-015) viram `corrigivel_parcial` — a correção semeia roadmap, factories, test-utils e documentação; a escrita dos testes fica para Fase 7.

ACHs puramente de pipeline/gate (ACH-006, ACH-007, ACH-014, ACH-016) são `corrigivel` — alteram CI/config sem precisar criar testes novos.

## Ordem de Execução

### 1. ACH-006 — Coverage threshold em CI (medio, corrigivel)
Arquivo: vitest.config.ts + .github/workflows/ci.yml. Ativar `--coverage` no step de testes; manter threshold baixo (atual 20%) por enquanto; failure do PR se cair abaixo.

### 2. ACH-007 — arch:check em CI (medio, corrigivel)
Arquivo: .github/workflows/ci.yml. Adicionar step `pnpm arch:check`.

### 3. ACH-014 — Threshold coverage escalonado (baixo, corrigivel)
Arquivo: vitest.config.ts. Documentar plano 40% Fase 6 / 70% Fase 7 / 80% depois em comentário; manter valor atual até Fase 7.

### 4. ACH-016 — CI matrix Node (baixo, corrigivel)
Arquivo: .github/workflows/ci.yml. strategy.matrix.node-version: [20, 22]; fail-fast: false.

### 5. ACH-013 — Pre-commit testes (baixo, corrigivel_parcial)
Arquivo: .husky/pre-commit. Comentário TODO documentado para Fase 7 (`pnpm vitest related --run`); não ativar agora.

### 6. ACH-008 — Factories compartilhadas (medio, corrigivel_parcial)
Criar packages/shared/src/__tests__/factories/*.ts esqueleto (makeMockRepo, clientFactory, saleFactory). Documentar padrão.

### 7. ACH-015 — test-utils compartilhado (baixo, corrigivel_parcial)
Criar packages/shared/src/__tests__/test-utils/*.ts esqueleto (mockTenantCtx, assertDomainInvariant). Documentar.

### 8-16. ACHs de portfolio (ACH-001-005, ACH-009, ACH-010, ACH-011, ACH-012)
Semente única: `begin/WBC-Fase7-Testes-Roadmap.md` com roadmap detalhado por achado (prisma repos, evil twin, confirmSale, rate-limit/idempotency/outbox, reset/forgot-password, redis mock, contract testing, E2E expandido, 6 módulos sem testes). Cada ACH referencia a seção correspondente no roadmap e aponta como `status: parcial-seed`.

## Resumo
- 4 corrigiveis + 12 corrigiveis_parciais = 16
- Estimativa de commits: ~10 (agrupados por tema: CI, factories+utils, roadmap único cobrindo 9 ACHs de portfolio)
