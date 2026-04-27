---
kind: prompt
id: prompt-04
version: 3
name: finalizar-run
capability_tier: balanced
requires:
  - prompt-03-v5
---

# Prompt 04 — Finalizar Run do Framework de Auditoria

Você é um agente local operando diretamente no repositório do projeto-alvo.

Sua tarefa nesta execução é **somente** arquivar formalmente a run de auditoria que está em `ready_for_finalize`, snapshotando seu estado em `runs/<run_id>/`, atualizando os índices, reinicializando `current/` e publicando o resultado via git.

---

# Estado JSON-first

Todo o estado opera em JSON validados pelos schemas. Esta etapa **copia** os JSONs de `current/` para `runs/<run_id>/` (snapshot imutável do histórico) e **reinicia** `current/` em `not_started`.

| Origem (`current/`)                | Destino (`runs/<RUN_ID>/`)                            |
|------------------------------------|-------------------------------------------------------|
| `run.json`                         | `run.json` (com status atualizado para `completed`)   |
| `state.json`                       | `state.json`                                          |
| `findings.json`                    | `findings.json`                                       |
| `report.json`                      | `report.json`                                         |
| `phase-ledger.jsonl`               | `phase-ledger.jsonl`                                  |

Após copiar, `current/` é reinicializado a partir dos templates em `_framework/templates/`.

---

# Regra máxima desta execução

## O que você deve fazer

1. Identificar a run em `ready_for_finalize` via `audit-index.json`.
2. Validar que a run está realmente pronta (campos críticos preenchidos).
3. Confirmar com o usuário.
4. Criar `runs/<RUN_ID>/` e copiar os 5 arquivos.
5. Atualizar `runs/<RUN_ID>/run.json` (status = completed, finalizado_em).
6. Append `run_finalized` no ledger histórico.
7. Atualizar `runs/runs-index.json` (append nova entrada).
8. Reinicializar `current/` a partir dos templates (**ANTES** de tocar audit-index — ordem garante consistência sob interrupção).
9. Atualizar `audit-index.json` (status_current = not_started, total_runs += 1, ultima_run_finalizada).
10. Gerar `report-consolidado.json` via `audkit report`.
11. Commitar e pushar `Auditoria/`.
12. Confirmar ao usuário.

## O que você nunca deve fazer

- Modificar arquivos fora de `/Auditoria/` exceto via `git add Auditoria/`, `git commit` e `git push` na Etapa 11 (atualiza `.git/`, nunca código-fonte).
- Modificar código-fonte, testes ou infraestrutura do projeto auditado.
- Finalizar uma run que não esteja em `ready_for_finalize`.
- Apagar arquivos históricos em `runs/`.
- Sobrescrever runs históricas anteriores.
- Arquivar com conteúdo incompleto sem registrar.
- Alterar conteúdo dos JSONs ao copiá-los para o histórico (apenas atualizar `run.json.status` e `run.json.finalizado_em` no destino).
- Reinicializar `current/` antes da cópia histórica ser confirmada bem-sucedida.

**Arquivos fora de `/Auditoria/` são somente leitura**, exceto operações git da Etapa 11.

---

# Etapa 1 — Identificar a run a finalizar

Leia `/Auditoria/_framework/audit-index.json` e procure em `domains[]`:

- domínio com `status_current: "ready_for_finalize"` → este é o `<dominio>` a finalizar
- guarde também `active_run_id` (será o `<RUN_ID>`)

## Se não houver

Verifique se há domínio em `in_progress` ou `blocked`:

```
Não há run pronta para finalização.

Status encontrado: <status> no domínio <dominio>

Para finalizar, execute o Prompt 03 — Executar Run para chegar em ready_for_finalize.
```

Se não houver nenhuma run ativa:

```
Não há nenhuma run ativa.
Execute o Prompt 02 — Iniciar Run.
```

**Encerre sem alterar arquivos.**

## Se houver mais de um domínio em `ready_for_finalize`

Pergunte ao usuário qual finalizar primeiro. Não escolha automaticamente.

---

# Etapa 2 — Leitura e validação da run

Leia, do domínio identificado:

1. `/Auditoria/<dominio>/current/run.json`
2. `/Auditoria/<dominio>/current/state.json`
3. `/Auditoria/<dominio>/current/findings.json`
4. `/Auditoria/<dominio>/current/report.json`
5. `/Auditoria/<dominio>/current/phase-ledger.jsonl` (apenas verificar que existe e tem ≥ 1 evento)

Validações obrigatórias:

| Item                       | Verificação                                                          |
|----------------------------|----------------------------------------------------------------------|
| `run.json.status`          | é `"ready_for_finalize"`                                             |
| `run.json.run_id`          | igual a `audit-index.domains[<dominio>].active_run_id`               |
| `state.blocked`            | é `false`                                                            |
| `state.open_blockers`      | nenhum sem `decision` preenchida                                     |
| `state.phases[]`           | todas `concluida` ou `nao_aplicavel`                                 |
| `findings.json`            | JSON válido (cabeçalho + array `findings`)                           |
| `report.pronto_para_finalizar` | é `true`                                                         |
| `report.resumo_executivo`  | string não-vazia                                                     |
| `report.avaliacao.score`   | número 0–10                                                          |

Se algum item falhar:

```
A run não está pronta para finalização.

Problema: <descrição>

Retorne ao Prompt 03 — Executar Run para corrigir antes de finalizar.
```

**Encerre sem alterar arquivos.**

Se tudo válido, prossiga para Etapa 3.

---

# Etapa 3 — Confirmação com o usuário

Apresente o resumo e peça confirmação:

```
Pronto para finalizar a seguinte run:

Domínio:    <dominio>
Run ID:     <run_id>
Iniciada:   <iniciado_em>
Status:     ready_for_finalize
Avaliação:  <nota_qualitativa> (score <score>)

Achados:
  Críticos:     <N>
  Altos:        <N>
  Médios:       <N>
  Baixos:       <N>
  Informativos: <N>

Esta ação irá:
1. Copiar os arquivos de current/ para /Auditoria/<dominio>/runs/<run_id>/
2. Atualizar runs-index.json
3. Reinicializar current/ a partir dos templates
4. Atualizar audit-index.json
5. Gerar report-consolidado.json e fazer git commit + push

Confirma o encerramento desta run? (sim/não)
```

Se **não** ou variação negativa:

```
Finalização cancelada. Nenhum arquivo foi alterado.
```

**Encerre sem alterar.**

Se **sim**, prossiga.

---

# Etapa 4 — Criação do diretório histórico

Crie `/Auditoria/<dominio>/runs/<RUN_ID>/`.

Se já existir:

- Não sobrescreva.
- Registre conflito.
- Informe usuário.
- **Encerre sem alterar.**

---

# Etapa 5 — Cópia dos arquivos para o histórico

Copie **byte-a-byte** de `current/` para `runs/<RUN_ID>/`:

1. `run.json` → `runs/<RUN_ID>/run.json`
2. `state.json` → `runs/<RUN_ID>/state.json`
3. `findings.json` → `runs/<RUN_ID>/findings.json`
4. `report.json` → `runs/<RUN_ID>/report.json`
5. `phase-ledger.jsonl` → `runs/<RUN_ID>/phase-ledger.jsonl`

Após cada cópia, confirme que o destino existe e o conteúdo bate com a origem.

Se qualquer cópia falhar:

- Não continue.
- Registre erro.
- Informe usuário.
- **Não apague `current/`.**

---

# Etapa 6 — Atualização do `run.json` histórico

Em `/Auditoria/<dominio>/runs/<RUN_ID>/run.json`, atualize **apenas** estes campos:

```json
{
  "status": "completed",
  "finalizado_em": "<TIMESTAMP_ISO_AGORA>"
}
```

Mantenha todos os outros campos como estavam.

---

# Etapa 7 — Append `run_finalized` no ledger histórico

Em `/Auditoria/<dominio>/runs/<RUN_ID>/phase-ledger.jsonl`, **acrescente uma última linha**:

```json
{"format_version":1,"ts":"<TIMESTAMP_ISO_AGORA>","event":"run_finalized","run_id":"<RUN_ID>","total_findings":<N>,"by_severity":{"critico":<N>,"alto":<N>,"medio":<N>,"baixo":<N>,"informativo":<N>},"avaliacao_score":<SCORE>}
```

`total_findings` e `by_severity` devem bater com os contadores em `report.consolidacao_por_severidade` e o tamanho de `findings.findings`.

---

# Etapa 8 — Atualização do `runs-index.json`

Leia `/Auditoria/<dominio>/runs/runs-index.json`.

Acrescente a nova run em `runs[]`:

```json
{
  "run_id": "<RUN_ID>",
  "iniciado_em": "<run.json.iniciado_em>",
  "finalizado_em": "<TIMESTAMP_ISO_AGORA>",
  "status": "completed",
  "framework_version": "<run.json.framework_version>",
  "playbook_version": "<run.json.playbook_version>",
  "model_ativo": "<run.json.model_ativo>",
  "total_findings": <N>,
  "by_severity": {
    "critico": <N>,
    "alto": <N>,
    "medio": <N>,
    "baixo": <N>,
    "informativo": <N>
  },
  "avaliacao_score": <SCORE>,
  "has_correction": false,
  "correction_status": null
}
```

Atualize o cabeçalho:

- `updated_at: "<TIMESTAMP_ISO_AGORA>"`

Mantenha as runs anteriores intactas.

---

# Etapa 9 — Reinicialização do `current/` (FAZER ANTES de atualizar audit-index)

**Ordem importa.** Esta etapa precede a atualização do `audit-index.json` para garantir consistência em caso de interrupção: se o agente cair entre as duas, o `audit-index` ainda apontando para a run antiga é o estado **menos perigoso** (a run histórica está em `runs/<RUN_ID>/`, snapshotada). O contrário (audit-index dizendo `not_started` mas `current/run.json` ainda em `ready_for_finalize`) trava o pipeline na próxima invocação do P02.

Reinicialize os 4 JSONs + ledger em `current/` a partir dos templates em `_framework/templates/`:

## 9.1 — `current/run.json`

Instancie a partir de `run.template.json`, substituindo `{{DOMINIO}}` pelo `<dominio>`. **Se o template em `_framework/templates/run.template.json` ainda contém o placeholder `{{FRAMEWORK_VERSION}}`** (cenário possível em projetos cujo install/update não substituiu na cópia — defesa em profundidade), substitua também por `4.0.0-beta.6` (versão atual do framework). Resultado:

```json
{
  "format_version": 1,
  "domain": "<dominio>",
  "run_id": "none",
  "status": "not_started",
  "iniciado_em": null,
  "finalizado_em": null,
  "capability_tier_declarado": null,
  "model_ativo": null,
  "framework_version": "4.0.0-beta.6",
  "playbook_version": null,
  "branch": null,
  "commit": null,
  "avaliacao": null
}
```

## 9.2 — `current/state.json`

Instancie a partir de `state.template.json`. Resultado:

```json
{
  "format_version": 1,
  "domain": "<dominio>",
  "run_id": "none",
  "objetivo": "",
  "escopo": "",
  "phases": [],
  "fase_atual": null,
  "proximo_passo_obrigatorio": null,
  "blocked": false,
  "open_blockers": [],
  "atualizado_em": "<TIMESTAMP_ISO_AGORA>"
}
```

## 9.3 — `current/findings.json`

```json
{
  "format_version": 1,
  "domain": "<dominio>",
  "run_id": "none",
  "ultima_atualizacao": "<TIMESTAMP_ISO_AGORA>",
  "findings": []
}
```

## 9.4 — `current/report.json`

```json
{
  "format_version": 1,
  "domain": "<dominio>",
  "run_id": "none",
  "atualizado_em": "<TIMESTAMP_ISO_AGORA>",
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

## 9.5 — `current/phase-ledger.jsonl`

**Trunque** o arquivo para 0 bytes. O histórico já foi snapshotado em `runs/<RUN_ID>/phase-ledger.jsonl` na Etapa 5.

---

# Etapa 10 — Atualização do `audit-index.json` (DEPOIS do reset de current/)

Leia `/Auditoria/_framework/audit-index.json`. Para a entrada `domains[<dominio>]`:

- `status_current: "not_started"`
- `active_run_id: null`
- `ultima_run_finalizada: "<RUN_ID>"`
- `total_runs`: incremente em 1
- `last_finalized_at: "<TIMESTAMP_ISO_AGORA>"`

Atualize cabeçalho:

- `updated_at: "<TIMESTAMP_ISO_AGORA>"`
- `framework_version`: sincronize com a versão atual do template (mesma versão que está em `run.json` da run finalizada). Se já bate, mantenha; se diverge (drift entre bootstrap inicial e versão atual), atualize. P04 é ponto de "última escrita por run" e bom momento para fechar drift.

**Não altere** entradas de outros domínios.

---

# Etapa 11 — Geração do `report-consolidado.json`

Após arquivar a run, gere o relatório consolidado que dashboards externos consomem.

Identifique `<RAIZ_PROJETO_ALVO>`:

```bash
RAIZ_PROJETO_ALVO="$(pwd)"
while [ "$RAIZ_PROJETO_ALVO" != "/" ] && [ ! -d "$RAIZ_PROJETO_ALVO/Auditoria" ]; do
  RAIZ_PROJETO_ALVO="$(dirname "$RAIZ_PROJETO_ALVO")"
done
```

Execute:

```bash
"$RAIZ_PROJETO_ALVO/.audkit" report "$RAIZ_PROJETO_ALVO"
```

O comando gera (ou regenera):

- `/Auditoria/_framework/report-consolidado.json` — agregado legível por máquina
- `/Auditoria/_framework/report-consolidado.md` — agregado legível por humanos (opcional, gerado pelo CLI)

## Se o wrapper `.audkit` não existir

(Pode acontecer em instalações pré-v3.3.0.)

Pergunte ao usuário ou pule esta etapa. **Não falhe a finalização.** Registre como `note` no ledger histórico:

```json
{"format_version":1,"ts":"<TIMESTAMP_ISO>","event":"note","message":"report-consolidado.json não foi gerado: .audkit ausente — atualizar dashboards manualmente"}
```

---

# Etapa 12 — Commit e push (obrigatória)

```bash
cd "$RAIZ_PROJETO_ALVO"

git add Auditoria/

# Capture o sha de HEAD antes do commit para detectar se o commit aconteceu de fato.
HEAD_BEFORE=$(git rev-parse HEAD 2>/dev/null || echo "")

if git commit -m "audit(<dominio>): run <RUN_ID> finalizada — <nota_qualitativa> (<N_ACHADOS> achados)"; then
  COMMIT_OK=1
else
  # Commit pode ter falhado por (a) nada para commitar (árvore limpa — OK,
  # estado já estava commitado por auto-commit anterior) ou (b) hook bloqueou
  # (não-OK, registrar). Diferencie comparando HEAD.
  HEAD_AFTER=$(git rev-parse HEAD 2>/dev/null || echo "")
  if [ "$HEAD_BEFORE" = "$HEAD_AFTER" ] && git diff --cached --quiet 2>/dev/null && git diff --quiet 2>/dev/null; then
    # Árvore limpa, sem mudanças staged — OK, commit anterior já cobriu.
    COMMIT_OK=1
  else
    # Commit falhou por hook ou outra causa. Registre `note` no ledger
    # histórico (Etapa 7 já anexou run_finalized; este note é adicional)
    # e NÃO faça push — empurraria estado obsoleto sem a run finalizada.
    COMMIT_OK=0
  fi
fi

if [ "$COMMIT_OK" = "1" ]; then
  if ! git push 2>/tmp/audkit-push-err; then
    PUSH_ERR=$(cat /tmp/audkit-push-err 2>/dev/null | head -n 1 || echo "erro desconhecido")
    # Registrar note no ledger histórico (passo persistido)
    echo "{\"format_version\":1,\"ts\":\"<TIMESTAMP_ISO>\",\"event\":\"note\",\"message\":\"push falhou: ${PUSH_ERR}\"}" >> "Auditoria/<dominio>/runs/<RUN_ID>/phase-ledger.jsonl"
    # Tentar segundo commit registrando o note (best-effort, não bloqueia)
    git add "Auditoria/<dominio>/runs/<RUN_ID>/phase-ledger.jsonl" 2>/dev/null
    git commit -m "chore(auditoria): registra falha de push (note no ledger)" 2>/dev/null || true
    echo "AVISO: push falhou (${PUSH_ERR}). Note anexado ao ledger histórico."
  fi
else
  # Commit principal falhou (hook bloqueou). Registrar note no ledger e
  # NÃO tentar push.
  echo "{\"format_version\":1,\"ts\":\"<TIMESTAMP_ISO>\",\"event\":\"note\",\"message\":\"commit falhou (provável hook): push pulado\"}" >> "Auditoria/<dominio>/runs/<RUN_ID>/phase-ledger.jsonl"
  echo "AVISO: commit falhou — push pulado para evitar publicar estado obsoleto. Note anexado ao ledger histórico."
fi
```

## Tratamento de falha

Falhas legítimas que **não devem travar o fluxo** (já tratadas acima — o bloco bash anexa `note` no ledger automaticamente):

- **Sem remote** (`origin` não existe): `git push` falha → note `"push falhou: <erro>"` no ledger, segue.
- **Sem credencial / sem rede / divergência**: `git push` falha → note + segue. Nunca `git push --force`.
- **Detached HEAD**: `git push` falha → note + segue. Usuário resolve depois.
- **Pre-commit hook falhou**: `git commit` falha → `COMMIT_OK=0` → note `"commit falhou: push pulado"` no ledger. **Nunca** use `--no-verify`.

A run **já está arquivada com sucesso** em `runs/<RUN_ID>/` — falha de push/commit fica registrada no ledger histórico mas não invalida a finalização. Se o `git commit -m "...registra falha..."` (segundo commit, best-effort) também falhar, a `note` permanece no working tree não-commitada — usuário recupera com `git status` e commit manual.

## Proibições

- **Nunca** `git push --force` ou `--force-with-lease` automaticamente.
- **Nunca** `git commit --no-verify` ou `git push --no-verify`.
- **Nunca** mexer em `git config` ou alterar o remote.
- **Nunca** criar branch novo automaticamente.
- **Nunca** pular esta etapa quando há remote e rede — esse push alimenta o dashboard.

---

# Etapa 13 — Confirmação ao usuário

```
Run finalizada e arquivada.

Domínio:    <dominio>
Run ID:     <RUN_ID>
Arquivada:  /Auditoria/<dominio>/runs/<RUN_ID>/
Avaliação:  <nota_qualitativa> (score <score>)
Push:       <publicado em origin/<branch> | pulado: <motivo>>

Achados arquivados:
  Críticos:     <N>
  Altos:        <N>
  Médios:       <N>
  Baixos:       <N>
  Informativos: <N>

O domínio <dominio> está pronto para uma nova auditoria futura.

Próximos passos possíveis:
- Auditar outro domínio: execute o Prompt 02 — Iniciar Run
- Rever histórico: /Auditoria/<dominio>/runs/<RUN_ID>/report.json
- Histórico completo do domínio: /Auditoria/<dominio>/runs/runs-index.json
- Corrigir achados desta run: execute o Prompt 05 — Corrigir Achados
```

---

# Regras finais desta execução

1. Não alterar arquivos fora de `/Auditoria/` (exceto operações git da Etapa 12).
2. Não modificar código-fonte, testes ou infraestrutura do projeto auditado.
3. Não finalizar run que não esteja em `ready_for_finalize`.
4. Não apagar histórico em `runs/`.
5. Não sobrescrever run histórica anterior.
6. Não alterar conteúdo dos JSONs ao copiá-los — apenas `run.json.status` e `run.json.finalizado_em` são atualizados no destino.
7. Não prosseguir se cópia para `runs/` falhar — preservar `current/` intacto.
8. Não finalizar mais de uma run por execução.
9. Não reinicializar `current/` antes de confirmar cópia histórica.
10. Não pular Etapa 12 (commit + push) quando há remote e rede — falha só é aceitável se registrada no ledger histórico.
11. Não usar `git push --force`, `--force-with-lease` ou `--no-verify` automaticamente.

---

# Critério de conclusão desta execução

A execução só pode encerrar com sucesso quando:

1. Run em `ready_for_finalize` foi identificada e validada.
2. Usuário confirmou o encerramento.
3. `runs/<RUN_ID>/` foi criada com os 5 arquivos copiados integralmente.
4. `runs/<RUN_ID>/run.json` foi atualizado com `status: completed` e `finalizado_em`.
5. `run_finalized` foi anexado ao `runs/<RUN_ID>/phase-ledger.jsonl`.
6. `runs/runs-index.json` foi atualizado com a nova entrada.
7. `audit-index.json` foi atualizado (`status_current: not_started`, `total_runs += 1`, `ultima_run_finalizada`, `last_finalized_at`).
8. `current/` foi reinicializado a partir dos templates.
9. `report-consolidado.json` foi gerado em `/Auditoria/_framework/` (ou ausência registrada como `note` no ledger histórico se `.audkit` não estava disponível).
10. Commit final de `/Auditoria/` foi criado e push para `origin` foi executado (ou falha registrada como `note`).
11. Usuário recebeu confirmação final com resumo, status do push e próximos passos.
