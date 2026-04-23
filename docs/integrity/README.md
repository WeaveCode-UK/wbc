# Integridade de Lockfile

## Propósito

Este diretório mantém o hash SHA-256 de `pnpm-lock.yaml` committado. O job CI `lockfile-integrity` (em `.github/workflows/ci.yml`) recalcula o hash em cada PR/push e compara com o valor aqui. Divergência = tampering ou atualização não-tracked — o job falha.

A motivação está em `Auditoria/supply-chain-dependencias/runs/2026-04-19_21-11-51/achados.md#ACH-009`: um atacante com acesso de push a uma branch poderia trocar linhas do lockfile (p.ex. para versões com CVE ou para versões com postinstall malicioso) sem que `pnpm install --frozen-lockfile` reclame. O hash detecta isso.

## Atualizando após bump legítimo

Quando você alterar `pnpm-lock.yaml` (seja por `pnpm install`, `pnpm update` ou edição manual), rode:

```bash
sha256sum pnpm-lock.yaml | awk '{print $1}' > docs/integrity/lockfile.sha256
```

Commite `docs/integrity/lockfile.sha256` junto com as mudanças no lockfile. O PR review vê ambos no diff e pode cruzar.

## Defense-in-depth

O hash sozinho não impede tampering — atacante com commit access pode atualizar ambos. A proteção real vem da combinação:

1. **Hash committado** (este diretório).
2. **CODEOWNERS** (PRs tocando `pnpm-lock.yaml` e `docs/integrity/` exigem review).
3. **`pnpm audit` e `license:check`** (CI gates adicionais) detectam mudanças semânticas suspeitas.
4. **GitHub Dependency Review Action** (PRs) mostra o diff humanamente.

Isolado, o hash é weak signal. Combinado, o custo de tampering silencioso sobe.

## Referência

- Achado origem: `Auditoria/supply-chain-dependencias/runs/2026-04-19_21-11-51/achados.md#ACH-009`
