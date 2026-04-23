# Revisão de `.husky/` — Política de Supply Chain

## Contexto

O `package.json` raiz executa `husky` no script `prepare`, que roda automaticamente em todo `pnpm install`. Esse comportamento instala os git hooks listados em `.husky/` nas máquinas dos desenvolvedores. A auditoria `supply-chain-dependencias/runs/2026-04-19_21-11-51` (ACH-015) sinalizou que se o conteúdo de `.husky/` for alterado maliciosamente (por PR comprometido ou sequestro de commit), o código dos hooks roda em máquinas locais durante o primeiro install — antes que alguém tenha oportunidade de revisar.

## Superfície de risco

| Vetor                                              | Impacto                                                                                                      |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| PR alterando `.husky/pre-commit`                   | Roda automaticamente em quem fizer `pnpm install` após merge; atacante pode exfiltrar arquivos de `$HOME`.   |
| Commit direto a `main` contornando review          | Mesmo efeito, mais rápido — por isso a regra de branch protection no GitHub é obrigatória.                   |
| Dependência transitiva com `postinstall` malicioso | Não é o mesmo problema que `.husky/`, mas é aparentado; veja `pnpm install --ignore-scripts` na seção de CI. |

## Controles em vigor

1. **`.github/CODEOWNERS` cobre `.husky/`:** qualquer PR tocando esse diretório exige aprovação de `@WeaveCode-UK/owners` (ver entrada abaixo, adicionada em 2026-04-23).
2. **Branch protection em `main`:** commits diretos são rejeitados; todo merge precisa passar por PR com CODEOWNERS approval.
3. **Gitleaks em pre-commit local + CI:** detecta segredos acidentalmente committados antes do push.
4. **CI não precisa de hooks locais:** o workflow `.github/workflows/ci.yml` usa `pnpm install --frozen-lockfile` sem scripts especiais além do `prepare` (que em GitHub Actions só roda `husky` — seguro porque não há git hooks locais no container).

## Checklist de review para PRs que tocam `.husky/`

Ao receber um PR com diff em `.husky/**`:

- [ ] Abrir cada arquivo alterado e ler linha por linha — hooks são scripts curtos, não aceitar "mudanças cosméticas" cegamente.
- [ ] Confirmar que o hook não faz rede, não grava fora do repo, não lê `$HOME` ou credenciais.
- [ ] Verificar que o comportamento adicional está documentado no próprio PR (ex: "adiciona check X ao pre-commit para evitar Y").
- [ ] Rodar `pnpm install` numa máquina limpa (ou container) e observar o que o `prepare` faz.
- [ ] Merge só com aprovação explícita de owner.

## Endurecimento opcional

Se quisermos aumentar a robustez futuramente:

1. **Assinatura de commits obrigatória** (`git config commit.gpgsign true` + branch protection exigindo `verified`): atacante precisaria de acesso a uma chave GPG válida do dev, não só do GitHub.
2. **`pnpm install --ignore-scripts` em CI para jobs que não precisam:** eliminaria o execução de `prepare`/`postinstall` em CI. Cuidado — alguns workflows (ex.: `db:generate` com Prisma) dependem de postinstall; só aplicar em jobs selecionados.
3. **Snapshot de `.husky/` com checksum committado:** scripts hash em CI comparam contra o esperado; diferença quebra o job.

Estas medidas estão documentadas aqui mas não foram implementadas nesta correção — são opt-in e exigem decisão de equipe.

## Referências

- Achado original: `Auditoria/supply-chain-dependencias/runs/2026-04-19_21-11-51/achados.md#ACH-015`
- `.github/CODEOWNERS` (linha adicionada em 2026-04-23 pelo ACH-015)
