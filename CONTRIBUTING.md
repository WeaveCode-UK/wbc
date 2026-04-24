# Contributing to WBC Platform

This document captures the policies that the GitHub UI enforces for the
`WeaveCode-UK/wbc` repository. Anyone with write access on the repo settings
is expected to keep the live configuration aligned with what is described
here. The configuration was hardened in response to ACH-017 (audit run
`2026-04-18_22-06-18`).

## Branch protection — `main`

The following rules MUST be enabled on `main` (Settings → Branches → Branch
protection rules):

- **Require a pull request before merging** — yes.
  - **Require approvals**: at least **1**.
  - **Dismiss stale pull request approvals when new commits are pushed**: yes.
  - **Require review from Code Owners** (see `.github/CODEOWNERS`): yes.
- **Require status checks to pass before merging** — yes.
  - Required checks: `lint-and-typecheck`, `test`, `secret-scan`.
  - **Require branches to be up to date before merging**: yes.
- **Require conversation resolution before merging**: yes.
- **Require signed commits**: yes (recommended).
- **Restrict who can push to matching branches**: yes (only release engineers).
- **Do not allow bypassing the above settings** (including admins): yes.
- **Allow force pushes / Allow deletions**: NO.

## Repository-level security settings

Enable in Settings → Code security & analysis:

- **Dependency graph**: enabled.
- **Dependabot alerts**: enabled.
- **Dependabot security updates**: enabled.
- **Secret scanning**: enabled.
- **Push protection** (block commits that contain secrets): enabled.
- **Private vulnerability reporting**: enabled.

## Pull request workflow

1. Open the PR against `main` from a topic branch (`feat/...`, `fix/...`,
   `chore/...`, `docs/...`).
2. CI must be green:
   - `lint-and-typecheck` — eslint + tsc across the workspace.
   - `test` — unit tests via vitest.
   - `secret-scan` — gitleaks (see `.gitleaks.toml`).
3. At least one CODEOWNER must approve.
4. All conversations must be resolved before merge.
5. Use **Squash and merge** as the default merge strategy. Conventional
   commit messages in the squashed PR title.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/) in English,
lowercase, no trailing period. Examples:

- `feat(auth): add TOTP enrolment use-case`
- `fix(ratelimit): use IP for anonymous bucket`
- `chore(deps): bump otplib to 12.0.1`

## Audit framework

Anything under `/Auditoria/` is the historical record of past audit runs
and corrections. Do not edit historical run files; new corrections always
go on a `fix/<dominio>/<run_id>` branch. See
`/Auditoria/_framework/framework.md` for the canonical workflow.

---

# Developer guide (ACH-003 documentacao-runbooks)

The sections above describe repo-level policies the GitHub UI enforces.
The sections below describe how contributors write code day-to-day.

## Branching

- Start every change from an up-to-date `main`.
- Branch name pattern: `<type>/<short-kebab>` — e.g. `feat/client-merge`,
  `fix/whatsapp-opt-out`, `chore/bump-typescript`, `docs/runbooks`.
- Keep branches short-lived (< 1 week). Rebase on `main` instead of
  merging main into the branch.

## Commits

Format: **Conventional Commits in English, lowercase, no trailing period.**

```
<type>(<scope>): <subject>

<body — WHY, not WHAT>

<footer — trailers like BREAKING CHANGE, Refs, etc.>
```

Types and typical scopes:

| Type       | When to use                                     | Common scopes                            |
| ---------- | ----------------------------------------------- | ---------------------------------------- |
| `feat`     | New feature visible to end user or API consumer | `auth`, `sales`, `clients`, `web`, `api` |
| `fix`      | Bug fix                                         | same                                     |
| `chore`    | Tooling, deps, CI, non-user-visible refactor    | `deps`, `ci`, `husky`, `turbo`           |
| `docs`     | Documentation only                              | `readme`, `adr`, `runbooks`              |
| `refactor` | Same behaviour, cleaner code                    | module being refactored                  |
| `test`     | Adding or fixing tests                          | same as the feature under test           |
| `perf`     | Performance improvement                         | same                                     |

Examples:

```
feat(auth): add TOTP enrolment use-case
fix(ratelimit): use IP for anonymous bucket
chore(deps): bump otplib to 12.0.1
docs(runbooks): add outbox-lag playbook
refactor(clients): extract phone normalization helper
```

**Commit body** — explain **why**. Assume the reader understands the code
but does not know the context that led you to this change. Example:

```
fix(whatsapp): retry send with exponential backoff on 429

The Meta Cloud API returns 429 when a tenant exceeds its per-minute
message rate. Without retry, the job ends up in the DLQ even for
transient bursts, which makes operators replay them manually.

With exponential backoff (1s, 2s, 4s max 3 attempts) we absorb 99%
of these cases before the DLQ.
```

**Conventional footer** for breaking changes:

```
feat(api)!: move auth endpoints to /v2

BREAKING CHANGE: clients using /api/auth must migrate to /api/v2/auth.
Old endpoints continue returning 410 Gone until 2026-Q4.
```

## Pull requests

### Checklist before opening

- [ ] `pnpm lint` + `pnpm type-check` passam localmente.
- [ ] `pnpm test` passa para os workspaces afetados.
- [ ] Se tocou `pnpm-lock.yaml`, atualizou `docs/integrity/lockfile.sha256`.
- [ ] Se tocou `docs/adr/*`, revalidou os "links cruzados" em outras docs.
- [ ] Se tocou `.husky/`, explicou a razão no PR body.
- [ ] Se adicionou override em `package.json`, atualizou `docs/OVERRIDES.md`.
- [ ] `Refs: #<issue-number>` no corpo do PR quando aplicável.

### PR title & body

- **Title:** Conventional Commit format, exactly as the commit that
  "Squash & merge" will produce.
- **Body:** 3 seções obrigatórias (template no GitHub):
  1. **Context** — por que esse PR existe (1-3 frases).
  2. **Changes** — lista objetiva de mudanças.
  3. **Test plan** — como o revisor valida. Sempre inclua "smoke test
     manual: navegar para X, clicar Y, verificar Z" para mudanças de UI.

### Review

- CODEOWNERS é obrigatório (ver `.github/CODEOWNERS`).
- Dois olhos para mudanças em `packages/db/`, `packages/business/auth/`,
  `.github/`, `deploy/`.
- Respostas a review comments: marque como "Resolved" apenas após o commit
  que implementa a mudança pedida OU após alinhamento explícito.

### Merge

- **Squash & merge** é o default. O título da PR vira o commit final em
  `main`.
- **Merge commit** é aceito somente quando preservar histórico de commits
  individuais tem valor (ex.: correções de auditoria com 1 commit por
  achado — veja `/Auditoria/_framework/prompts/prompt-05-*.md`).
- **Rebase & merge**: evite; dificulta bisect.

## Architecture checks (`pnpm arch:check`)

O dependency-cruiser enforca o ADR-001 (hexagonal):

- `domain/` não pode importar de `adapters/`.
- `packages/business/**` não pode importar de `apps/**`.
- `packages/shared/**` não pode importar de `packages/business/**`.

Se você precisa violar uma dessas regras, abra um ADR antes de abrir o PR.

## Documentation policy (ACH-011 + ACH-014 + ACH-016)

### Language (ACH-016)

- **Technical docs** in `docs/`: **English** (target audience includes
  external contributors and future auditors).
- **Audit framework** in `Auditoria/` and `begin/`: **pt-BR** (internal,
  original language of the framework and project orchestration).
- **Code comments**: **English**, consistent with the codebase.
- **PR body and commit messages**: **English**.

Translating a doc requires an ADR (one-off decisions end up inconsistent).

### Code comment policy (ACH-011)

Historical comments reference audit IDs (`ACH-011`, `ACH-003`, etc.).
These are opaque to readers outside the team. Going forward:

- **Prefer WHY-comments** over ACH references:
  ```ts
  // Avoid: // ACH-011: validate phone
  // Prefer: // Phone is validated here because Zod is too late — the API
  //         accepts mutations that bypass the controller (see ADR-001).
  ```
- **ACH references can still appear** next to the why-comment as a
  traceability footnote, e.g. `// (ACH-011 seguranca)`.
- **Do not mass-rewrite** existing ACH comments — churn is worse than
  opacity. Replace when you touch the surrounding code for another reason.

### Docs freshness policy (ACH-014)

Every file in `docs/` (and `SECURITY.md`, `CONTRIBUTING.md`, `README.md`)
should end with a footer:

```markdown
---

_Última revisão: YYYY-MM-DD · Próxima revisão esperada: YYYY-MM-DD_
```

- **Next review** is generally +3 months for operational docs, +12 months
  for ADRs / policy docs.
- CI check (opcional, roadmap): workflow que lista docs com
  `next-review < today` e abre issue.
- When you edit a doc, update `Última revisão` in the same PR.

The policy rolls out gradually; docs without footer yet are NOT treated
as stale — they just aren't under the policy yet.

---

_Última revisão: 2026-04-24 · Próxima revisão esperada: 2026-07-24_
