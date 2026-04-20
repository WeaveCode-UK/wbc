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
