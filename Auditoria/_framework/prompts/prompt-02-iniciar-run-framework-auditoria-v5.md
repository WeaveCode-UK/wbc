---
kind: prompt
id: prompt-02
version: 5
name: iniciar-run
capability_tier: balanced
requires:
  - prompt-01a-v3
  - prompt-01b-v3
---

# Prompt 02 — Iniciar Run do Framework de Auditoria

Você é um agente local operando diretamente no repositório do projeto-alvo.

Sua tarefa nesta execução é **somente** abrir formalmente uma nova run de auditoria para um único domínio escolhido pelo usuário, com base no playbook oficial desse domínio.

---

# Estado JSON-first

Todo o estado operacional desta run vive em arquivos JSON validados pelos schemas em `schemas/runtime/` do template:

- `/Auditoria/_framework/audit-index.json` — estado global (`audit-index.schema.json`)
- `/Auditoria/<dominio>/current/run.json` — identidade da run (`run.schema.json`)
- `/Auditoria/<dominio>/current/state.json` — fases, fase_atual, blockers (`state.schema.json`)
- `/Auditoria/<dominio>/current/findings.json` — catálogo de achados (`findings.schema.json`)
- `/Auditoria/<dominio>/current/report.json` — relatório consolidado (`report.schema.json`)
- `/Auditoria/<dominio>/current/phase-ledger.jsonl` — eventos append-only (`phase-ledger.schema.json` por linha)

Antes de gravar qualquer JSON, valide mentalmente que ele tem `format_version: 1` e os campos obrigatórios.

---

# Objetivo

1. Apresentar os 16 domínios disponíveis
2. Receber a escolha do usuário
3. Validar o domínio
4. Ler o playbook oficial do domínio
5. Inicializar a run em JSON
6. Atualizar `audit-index.json`
7. Encerrar

Você **não deve** executar auditoria nesta etapa.
Você **não deve** finalizar run nesta etapa.
Você **não deve** alterar arquivos fora de `/Auditoria/`.

---

# Etapa 1 — Validação do Bootstrap Core

Verifique a existência de:

- `/Auditoria/_framework/audit-index.json`
- `/Auditoria/_framework/templates/{run,state,findings,report,runs-index}.template.json`
- `/Auditoria/_framework/playbooks/` (diretório)

Leia `audit-index.json` e confirme:

- arquivo válido como JSON
- `format_version: 1`
- `playbooks_seed_status: "completed"`

Se qualquer condição falhar:

- Se `audit-index.json` ausente → orientar a executar Prompt 01A.
- Se `playbooks_seed_status: "pending"` → orientar a executar Prompt 01B.
- **Encerre sem alterar arquivos.**

---

# Etapa 2 — Apresentação dos domínios disponíveis

Apresente ao usuário os 16 domínios oficiais (ordem canônica):

```
Domínios de auditoria disponíveis:

 1. arquitetura
 2. codigo-manutenibilidade
 3. seguranca
 4. apis-integracoes
 5. dados-persistencia
 6. performance-escalabilidade
 7. confiabilidade-resiliencia
 8. observabilidade-operacao
 9. testes-qualidade
10. ui-ux-fluxos
11. infraestrutura-deploy-config
12. compliance-privacidade
13. supply-chain-dependencias
14. custos-finops
15. documentacao-runbooks
16. ai-ml-governanca

Qual domínio você deseja auditar agora?
```

Aguarde a resposta. Aceite tanto número quanto slug. Use o slug canônico em todas as escritas subsequentes.

---

# Etapa 3 — Validação da estrutura por domínio

Para o `<dominio>` escolhido, verifique a existência de:

- `/Auditoria/_framework/playbooks/<dominio>.playbook.md`
- `/Auditoria/<dominio>/current/run.json`
- `/Auditoria/<dominio>/current/state.json`
- `/Auditoria/<dominio>/current/findings.json`
- `/Auditoria/<dominio>/current/report.json`
- `/Auditoria/<dominio>/current/phase-ledger.jsonl`
- `/Auditoria/<dominio>/runs/runs-index.json`

Se qualquer item ausente, oriente a executar 01A/01B e **encerre sem alterar arquivos**.

---

# Etapa 4 — Verificação de run ativa

Leia `/Auditoria/<dominio>/current/run.json` e verifique `status`:

| status                  | Ação                                                                |
|-------------------------|---------------------------------------------------------------------|
| `not_started`           | prossiga para Etapa 5                                               |
| `in_progress`           | run em execução — oriente a continuar com **Prompt 03** e **encerre** |
| `blocked`               | run bloqueada — oriente a desbloquear com **Prompt 03 Etapa 2.1** e **encerre** |
| `ready_for_finalize`    | run pronta — oriente a finalizar com **Prompt 04** e **encerre**    |
| qualquer outro          | reporte conflito e **encerre**                                      |

Mensagens por status:

**`in_progress`:**
```
Já existe uma run em execução no domínio <dominio>.

Status: in_progress
Run ID: <run_id>

Para continuar a execução, carregue o Prompt 03 — Executar Run.
Nenhuma alteração foi feita.
```

**`blocked`:**
```
Existe uma run bloqueada no domínio <dominio>.

Status: blocked
Run ID: <run_id>

Para desbloquear e continuar, carregue o Prompt 03 — Executar Run (Etapa 2.1 conduz o desbloqueio).
Nenhuma alteração foi feita.
```

**`ready_for_finalize`:**
```
Existe uma run pronta para finalização no domínio <dominio>.

Status: ready_for_finalize
Run ID: <run_id>

Para arquivar a run, carregue o Prompt 04 — Finalizar Run.
Nenhuma alteração foi feita.
```

---

# Etapa 5 — Detecção de stack

Verifique a presença na **raiz do projeto-alvo** (fora de `/Auditoria/`):

| Arquivo                                                | Stack    |
|--------------------------------------------------------|----------|
| `package.json`                                         | node     |
| `pyproject.toml` ou `requirements.txt` ou `setup.py`   | python   |
| `go.mod`                                               | go       |
| `Cargo.toml`                                           | rust     |
| `pom.xml` ou `build.gradle`                            | java     |
| `composer.json`                                        | php      |
| `Gemfile`                                              | ruby     |
| `mix.exs`                                              | elixir   |
| `deno.json`                                            | deno     |
| `Package.swift`                                        | swift    |

Múltiplas stacks são possíveis. Guarde a lista detectada (vai pra `state.json` e pro evento de ledger).

---

# Etapa 6 — Leitura do playbook

Leia `/Auditoria/_framework/playbooks/<dominio>.playbook.md`.

Extraia obrigatoriamente:

- **Objetivo do Domínio** → vai para `state.json.objetivo`
- **Escopo Padrão da Run** → vai para `state.json.escopo`
- **Ordem Oficial das Fases** → vira o array `state.json.phases` (cada fase com `status: "pendente"`)
- **Critérios para `ready_for_finalize`** → registre em `state.json.proximo_passo_obrigatorio` ou em ledger note
- **Situações Típicas de Bloqueio** → contexto interno (não escreve direto)

Extraia também `version` do frontmatter do playbook → vai para `run.json.playbook_version`.

**Não invente fases. Não reordene. Use exatamente o que estiver no playbook.**

---

# Etapa 7 — Geração do Run ID e identidade da execução

Gere o `RUN_ID` no formato:

```
YYYY-MM-DD_HH-mm-ss
```

Capture também:

- `TIMESTAMP_ISO` — ISO 8601 do momento atual (ex.: `2026-04-25T14:30:00Z`)
- `MODELO_ATIVO` — nome do modelo que vai executar o Prompt 03 (ex.: `claude-opus-4-7`). **Deve ser o modelo de capacidade frontier** que conduzirá a auditoria.
- `TIER` — capability tier exigido pelo Prompt 03. Leia do frontmatter de `prompt-03-*.md` (sempre `capability_tier: frontier`). **Use sempre `frontier`** — esta é a política do framework para análise de código. P02 não pode rebaixar este valor mesmo sendo `balanced` ele próprio.
- `BRANCH` — branch git atual (`git rev-parse --abbrev-ref HEAD`), se for repo git
- `COMMIT` — sha curto atual (`git rev-parse HEAD`), se for repo git

---

# Etapa 8 — Inicialização dos arquivos JSON da run

Sobrescreva os 4 JSONs em `current/` (que estavam em `not_started`) com a identidade da nova run.

## 8.1 — `/Auditoria/<dominio>/current/run.json`

```json
{
  "format_version": 1,
  "domain": "<dominio>",
  "run_id": "<RUN_ID>",
  "status": "in_progress",
  "iniciado_em": "<TIMESTAMP_ISO>",
  "finalizado_em": null,
  "capability_tier_declarado": "<TIER>",
  "model_ativo": "<MODELO_ATIVO>",
  "framework_version": "4.0.0-beta.6",
  "playbook_version": "<VERSAO_DO_PLAYBOOK>",
  "branch": "<BRANCH_OU_NULL>",
  "commit": "<COMMIT_OU_NULL>",
  "avaliacao": null
}
```

`capability_tier_declarado` é o `<TIER>` capturado na Etapa 7 — sempre `frontier`. Esse valor é anexado idêntico ao evento `run_started` no ledger (Etapa 9), garantindo que `run.json` e `phase-ledger.jsonl` tenham a mesma identidade de tier.

## 8.2 — `/Auditoria/<dominio>/current/state.json`

```json
{
  "format_version": 1,
  "domain": "<dominio>",
  "run_id": "<RUN_ID>",
  "objetivo": "<OBJETIVO_EXTRAIDO_DO_PLAYBOOK>",
  "escopo": "<ESCOPO_PADRAO_EXTRAIDO_DO_PLAYBOOK>",
  "phases": [
    {
      "id": "fase-01",
      "nome": "<NOME_DA_FASE_1_DO_PLAYBOOK>",
      "status": "pendente",
      "checks_total": <NUMERO_DE_CHECKS_DA_FASE_OU_NULL>,
      "checks_executados": 0,
      "started_at": null,
      "completed_at": null,
      "skip_reason": null,
      "findings_created": [],
      "limitations": []
    }
    // ... uma entrada por fase, na Ordem Oficial do playbook
  ],
  "fase_atual": "fase-01",
  "proximo_passo_obrigatorio": "executar Prompt 03 — Executar Run para iniciar a primeira fase",
  "blocked": false,
  "open_blockers": [],
  "atualizado_em": "<TIMESTAMP_ISO>"
}
```

IDs de fase seguem o padrão `fase-NN` em sequência (`fase-01`, `fase-02`, …) na Ordem Oficial. Não pular números.

## 8.3 — `/Auditoria/<dominio>/current/findings.json`

```json
{
  "format_version": 1,
  "domain": "<dominio>",
  "run_id": "<RUN_ID>",
  "ultima_atualizacao": "<TIMESTAMP_ISO>",
  "findings": []
}
```

## 8.4 — `/Auditoria/<dominio>/current/report.json`

```json
{
  "format_version": 1,
  "domain": "<dominio>",
  "run_id": "<RUN_ID>",
  "atualizado_em": "<TIMESTAMP_ISO>",
  "resumo_executivo": "",
  "consolidacao_por_severidade": {
    "critico": 0,
    "alto": 0,
    "medio": 0,
    "baixo": 0,
    "informativo": 0
  },
  "consolidacao_por_categoria": {},
  "avaliacao": null,
  "conclusoes": null,
  "pronto_para_finalizar": false,
  "bloqueadores_para_finalizar": []
}
```

---

# Etapa 9 — Append no `phase-ledger.jsonl`

`phase-ledger.jsonl` é **append-only**. Cada linha é um evento JSON validado contra `phase-ledger.schema.json`.

O arquivo deve estar vazio (Bootstrap criou em 0 bytes). Se tiver conteúdo herdado de run anterior, **não apague** — anexe a primeira linha desta run no final do arquivo (o histórico de runs anteriores já foi snapshotado em `runs/<run_id>/phase-ledger.jsonl` pelo Prompt 04).

Acrescente esta linha (uma única linha, sem quebra interna):

```json
{"format_version":1,"ts":"<TIMESTAMP_ISO>","event":"run_started","run_id":"<RUN_ID>","domain":"<dominio>","framework_version": "4.0.0-beta.6","playbook_version":"<VERSAO_DO_PLAYBOOK>","capability_tier_declarado":"<TIER>","model_ativo":"<MODELO_ATIVO>"}
```

---

# Etapa 10 — Atualização do `audit-index.json`

Leia `/Auditoria/_framework/audit-index.json`, atualize a entrada do `<dominio>` em `domains[]`:

- `status_current`: `"in_progress"`
- `active_run_id`: `"<RUN_ID>"`
- (NÃO altere `ultima_run_finalizada`, `total_runs`, `last_finalized_at`)

Atualize o cabeçalho:

- `updated_at`: `"<TIMESTAMP_ISO>"`
- `framework_version`: sincronize com a versão atual do template (lida de `<repo>/cli/package.json` ou da string `versao_framework` em `bootstrap-report.md`). Se já bate, mantenha. Se diverge (ex.: projeto foi atualizado via `audkit update` mas audit-index.json ainda apontava para versão do bootstrap), atualize aqui — P02 é o ponto de "primeira escrita por run" e bom momento para detectar drift de versão.

**Não altere** entradas de outros domínios.

Grave o arquivo de volta validando que continua passando o schema.

---

# Etapa 11 — Confirmação ao usuário

```
Run iniciada com sucesso.

Domínio: <dominio>
Run ID:  <RUN_ID>
Status:  in_progress

Fases planejadas (ordem oficial do playbook):
1. <NOME_DA_FASE_1>
2. <NOME_DA_FASE_2>
…

Próximo passo:
Execute o Prompt 03 — Executar Run.
A primeira fase a executar é: <NOME_DA_FASE_1>
```

---

# Regras finais desta execução

1. Não executar auditoria técnica do projeto.
2. Não analisar código, arquitetura, segurança ou qualquer domínio.
3. Não alterar arquivos fora de `/Auditoria/`.
4. Não modificar código-fonte, testes ou infraestrutura do projeto auditado.
5. Não abrir mais de uma run por execução.
6. Não sobrescrever run ativa existente.
7. Não inventar fases — usar apenas as do playbook.
8. Não modificar outros domínios além do escolhido.
9. Não tocar em `runs/<run_id>/` nem em `runs/runs-index.json` nesta etapa.
10. Não escrever placeholder `{{...}}` em arquivo final — substituir todos os valores.

---

# Critério de conclusão desta execução

A execução só pode encerrar quando:

1. Domínio escolhido foi validado e confirmado.
2. Bootstrap Core e Seed de Playbooks estão completos.
3. Não há run ativa em conflito.
4. Os 4 JSONs em `current/` foram inicializados validando contra schemas.
5. Linha `run_started` foi anexada ao `phase-ledger.jsonl`.
6. `audit-index.json` foi atualizado com o novo `status_current` e `active_run_id`.
7. Usuário recebeu a confirmação com fases planejadas e próximo passo.

---

# Saída esperada ao encerrar

1. Não executar fases de auditoria.
2. Não finalizar run.
3. Apenas confirmar a run aberta.
4. Encerrar.
