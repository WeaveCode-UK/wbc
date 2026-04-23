# Branch Protection — Follow-up (ACH-005)

A auditoria ui-ux-fluxos / infra apontou que `main` não tem branch
protection configurado. CODEOWNERS existe (expandido agora com
`/docs/dr/`, `/infra/`, `/apps/api/src/middleware/` e o grupo de auth).
A configuração de branch protection propriamente dita é feita **na UI
do GitHub** (ou via API) — este doc descreve os valores alvo.

## Como configurar

1. **GitHub UI** → Settings → Branches → Add rule (`main`).
2. OU via `gh` CLI:

```bash
gh api --method PUT \
  /repos/WeaveCode-UK/wbc/branches/main/protection \
  -H 'Accept: application/vnd.github+json' \
  -f 'required_status_checks[strict]=true' \
  -F 'required_status_checks[contexts][]=lint' \
  -F 'required_status_checks[contexts][]=type-check' \
  -F 'required_status_checks[contexts][]=test' \
  -F 'required_status_checks[contexts][]=arch:check' \
  -F 'required_status_checks[contexts][]=build (web)' \
  -F 'required_status_checks[contexts][]=build (worker)' \
  -f 'enforce_admins=true' \
  -f 'required_pull_request_reviews[dismiss_stale_reviews]=true' \
  -f 'required_pull_request_reviews[require_code_owner_reviews]=true' \
  -f 'required_pull_request_reviews[required_approving_review_count]=1' \
  -f 'restrictions=null' \
  -f 'allow_force_pushes=false' \
  -f 'allow_deletions=false' \
  -f 'required_linear_history=true' \
  -f 'required_conversation_resolution=true'
```

## Valores alvo (detalhado)

| Campo                               | Valor                                                           | Justificativa                                   |
| ----------------------------------- | --------------------------------------------------------------- | ----------------------------------------------- |
| required_status_checks.strict       | true                                                            | PR precisa estar em dia com main antes do merge |
| required_status_checks.contexts     | lint, type-check, test, arch:check, build (web), build (worker) | todos os gates da pipeline                      |
| enforce_admins                      | true                                                            | admins também respeitam regra                   |
| required_pull_request_reviews.count | 1                                                               | mínimo viável até ter time                      |
| require_code_owner_reviews          | true                                                            | PRs em áreas sensíveis pedem codeowner          |
| dismiss_stale_reviews               | true                                                            | novo commit invalida aprovação anterior         |
| allow_force_pushes                  | false                                                           | história imutável em main                       |
| allow_deletions                     | false                                                           | main não pode ser deletada                      |
| required_linear_history             | true                                                            | sem merge commits confusos                      |
| required_conversation_resolution    | true                                                            | discussões precisam ser resolvidas              |

## Pendências humanas

1. **Rodar o comando** `gh api ...` acima com token adequado (`admin:repo`).
2. **Verificar** que os nomes dos contexts batem com o que CI publica
   (`jobs.*.name` em `.github/workflows/ci.yml` e `docker-images.yml`).
3. **Decidir sobre `build (web)` / `build (worker)` como blocker**: se
   o workflow de docker-images é opcional, melhor não bloquear o merge
   nele (imagens podem ser re-geradas).
4. **Expandir CODEOWNERS** quando houver time real — hoje tudo aponta
   para `@WeaveCode-UK/owners` (grupo), e o grupo pode ter só uma pessoa.
5. **Auditar bypasses**: GitHub reporta bypasses em branch protection.
   Periodicamente revisar o log.
