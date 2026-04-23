# Política de Licenciamento — WBC Platform

## Contexto

O WBC Platform é um produto SaaS proprietário distribuído pela WeaveCode Ltd (UK). Como monorepo instala centenas de dependências transitivas, há risco concreto de importar bibliotecas com licenças copyleft (GPL, AGPL) incompatíveis com o modelo de distribuição. A auditoria `supply-chain-dependencias/runs/2026-04-19_21-11-51` (ACH-007) sinalizou que não havia política formal nem scan de licenças no CI.

Este documento define a política; o job `license:check` (adicionado em `.github/workflows/ci.yml` junto com esta correção) a enforce.

## Allowlist (permitidas sem review)

Licenças aceitas em dependências diretas e transitivas:

- `MIT`
- `ISC`
- `BSD-2-Clause`
- `BSD-3-Clause`
- `Apache-2.0`
- `0BSD`
- `Unlicense`
- `CC0-1.0`

Estas são licenças permissivas que permitem uso comercial, modificação e redistribuição sob termos compatíveis com SaaS proprietário.

## Requer review humano (não-bloqueante no CI, mas cria issue)

- `MPL-2.0` — aceitável para dependências de infraestrutura/build; não aceitável para código linkado estaticamente a módulos proprietários.
- `EPL-2.0` — semelhante ao MPL.
- `BSD-4-Clause` — cláusula de atribuição pode criar obrigação em publicidade.
- `CC-BY-4.0` — atribuição obrigatória; avaliar caso a caso (ex.: bases de dados de assets).

## Denylist (proibidas)

Licenças que impedem distribuição SaaS ou exigem abertura de código proprietário:

- `GPL-2.0-only`, `GPL-2.0-or-later`, `GPL-3.0-only`, `GPL-3.0-or-later`
- `AGPL-3.0-only`, `AGPL-3.0-or-later`
- `LGPL-3.0-only`, `LGPL-3.0-or-later` (linking dinâmico pode ser aceito com review; linking estático não)
- `SSPL-1.0`
- `CC-BY-NC-*` (non-commercial)
- `CC-BY-SA-*` (share-alike)
- `BUSL-1.1` (Business Source License, depende de versão)
- `EUPL-1.2` (copyleft fraco, mas com obrigação de compartilhamento)

## Fluxo quando uma nova licença aparece

1. Dev adiciona dependência → CI roda `pnpm license:check`.
2. Se a licença está na allowlist → sucesso, PR prossegue.
3. Se está na denylist → falha **crítica**; substituir a dependência ou rejeitar o PR.
4. Se está em "requer review" → CI emite warning mas não falha; CODEOWNERS `@WeaveCode-UK/owners` precisa aprovar.
5. Se é desconhecida ou `UNLICENSED` → falha; tratamento igual ao denylist até que um owner classifique.

## Comando local

```bash
pnpm license:check
```

Roda `license-checker-rseidelsohn` com config em `.license-checker.json`, respeitando a allowlist.

## Auditoria periódica

- O job CI `license-scan` roda em PRs contra `main` e em push direto a `main`.
- Revisão trimestral de `.license-checker.json` pelo time de engenharia.
- Novas licenças descobertas em bumps de dependências → abertas como issues e triadas em 7 dias.

## SBOM

O SBOM CycloneDX gerado pelo ACH-005 inclui campo `licenses` para cada componente. Em conjunto com `license:check`, cobre auditoria reativa (SBOM) e preventiva (CI gate).

## Referências

- Achado original: `Auditoria/supply-chain-dependencias/runs/2026-04-19_21-11-51/achados.md#ACH-007`
- [`license-checker-rseidelsohn`](https://www.npmjs.com/package/license-checker-rseidelsohn)
- [SPDX License List](https://spdx.org/licenses/)
