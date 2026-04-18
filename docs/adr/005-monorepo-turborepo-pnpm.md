# ADR-005: Monorepo Turborepo + pnpm workspaces

- **Status:** aceito (retroativo — ACH-003 da auditoria de arquitetura)
- **Data:** 2026-04-18

## Contexto

O projeto WBC Platform é um CRM multi-tenant composto por múltiplos apps (web, mobile, worker, landing, api) e pelo menos 23 packages internos (16 business/\* + 7 compartilhados). A escolha de como organizar esse código no Git e no sistema de build foi tomada no início do projeto mas não havia sido registrada em ADR.

A auditoria de arquitetura (run `2026-04-18_18-17-50`) identificou o gap como ACH-003.

## Decisão

Adotar **monorepo único** com **Turborepo** como orquestrador de build/test/lint e **pnpm workspaces** como gerenciador de pacotes/dependências.

### Configuração

- `turbo.json` na raiz declara tasks globais (`build`, `lint`, `type-check`, `test`, `db:*`).
- `pnpm-workspace.yaml` lista globs dos workspaces: `apps/*`, `packages/*`, `packages/business/*`.
- `package.json` raiz contém devDependencies de ferramentas compartilhadas (turbo, typescript, vitest, prettier, dependency-cruiser, etc.).
- `pnpm` overrides garantem versões consistentes de peer deps críticas (`react`, `ioredis`, etc.).

### Regras de workspace

1. **Apps em `apps/`** — aplicações executáveis (Next.js, Expo, worker Node).
2. **Packages em `packages/`** — código reutilizável entre apps. Categorias:
   - `packages/business/*` — lógica de domínio (16 módulos hexagonais).
   - `packages/db/` — Prisma schema + helpers.
   - `packages/shared/` — utilities cross-cutting.
   - `packages/ui/`, `packages/ui-native/` — componentes visuais.
   - `packages/validators/`, `packages/config/`, `packages/i18n/` — infra compartilhada.
3. **Nomenclatura:** todos os packages publicam sob scope `@wbc/` (ex: `@wbc/shared`, `@wbc/business-sales`).
4. **Versionamento interno:** todos os packages usam `workspace:*` como dependência mútua — versões sincronizadas, sem publicação externa no NPM.

## Alternativas consideradas

### Polirepo (um repo por app/package)

- **Prós:** isolamento forte; permissões granulares por repo; CI independente.
- **Contras:** complexidade alta de coordenar mudanças cross-repo (PRs múltiplos, releases escalonados); perda de refactoring cross-package atômico; custo de infra (múltiplos repos, múltiplos CIs); onboarding lento (clone N repos).
- **Rejeitado** para MVP: a coesão do domínio justifica o mono.

### Multirepo com lerna / nx

- **Prós:** ferramentas maduras; suporte a publicação no NPM.
- **Contras:** nx é mais pesado que turbo; lerna foi parcialmente abandonado; o projeto não precisa publicar no NPM (tudo interno).
- **Rejeitado:** Turborepo é mais leve e cobre o caso sem over-engineering.

### npm/yarn workspaces

- **Prós:** nativo no npm/yarn; sem dep extra.
- **Contras:** disk usage alto (cada workspace tem node_modules duplicado no pior caso); yarn PnP tem compatibilidade limitada.
- **Rejeitado:** pnpm resolve isso com content-addressable store (sem duplicação); performance melhor.

## Consequências

### Positivas

- Atomic refactors cross-package (ex: mudar `@wbc/shared/events` + atualizar todos consumers num PR).
- Turbo cache acelera CI (só rebuilda pacotes afetados).
- pnpm cache compartilhado reduz disk usage (~1.2GB atual vs ~4GB+ com npm/yarn no mesmo escopo).
- Convenção `workspace:*` elimina drift de versões internas.

### Negativas / trade-offs

- Clone inicial é grande (todos packages juntos).
- PRs podem ficar maiores quando mudanças cruzam limites de package.
- Precisa disciplina para não "esconder acoplamento" que deveria ser via evento (mitigado pelo `dependency-cruiser` no ACH-007).
- CI precisa entender Turbo para aproveitar cache (configuração extra vs polirepo).

### Migração

- Se o projeto crescer a ponto de times independentes quererem autonomia total, avaliar migração para polirepo seletivo (ex: extrair `packages/ui-native/` + mobile para repo separado).
- Critério de decisão: quando o CI de um PR específico demorar > 15min mesmo com cache, reavaliar.

## Links

- `turbo.json`, `pnpm-workspace.yaml`, `package.json` (raiz)
- ADR-001 — Hexagonal (define boundaries entre packages business/\*)
- ACH-003 — Auditoria de arquitetura
- `pnpm run arch:check` — valida que boundaries são respeitadas
