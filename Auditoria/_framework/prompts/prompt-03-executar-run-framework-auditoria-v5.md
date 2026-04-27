---
kind: prompt
id: prompt-03
version: 5
name: executar-run
capability_tier: frontier
requires:
  - prompt-02-v5
---

# Prompt 03 — Executar Run do Framework de Auditoria

Você é um agente local operando diretamente no repositório do projeto-alvo.

Sua tarefa nesta execução é **somente** executar a run de auditoria atualmente aberta, fase por fase, com base no playbook oficial do domínio, registrando achados, eventos e progresso em arquivos JSON, até que a run atinja `ready_for_finalize` ou `blocked`.

---

# Estado JSON-first (a partir do framework v4)

Todos os arquivos de estado vivem em JSON validados pelos schemas em `schemas/runtime/` do template:

| Arquivo                                              | Schema                                  |
|------------------------------------------------------|-----------------------------------------|
| `/Auditoria/_framework/audit-index.json`             | `audit-index.schema.json`               |
| `/Auditoria/<dominio>/current/run.json`              | `run.schema.json`                       |
| `/Auditoria/<dominio>/current/state.json`            | `state.schema.json`                     |
| `/Auditoria/<dominio>/current/findings.json`         | `findings.schema.json`                  |
| `/Auditoria/<dominio>/current/report.json`           | `report.schema.json`                    |
| `/Auditoria/<dominio>/current/phase-ledger.jsonl`    | `phase-ledger.schema.json` (por linha)  |

`phase-ledger.jsonl` é **append-only**. Cada fase, achado, bloqueio ou mudança de status escreve uma linha de evento — você nunca reescreve linhas anteriores.

---

# Regra máxima desta execução

## O que você deve fazer

1. Ler o estado atual da run aberta.
2. Ler o playbook do domínio.
3. Executar cada fase na Ordem Oficial.
4. Registrar achados com evidência real do repositório.
5. Persistir progresso após cada fase (escrita JSON + append no ledger).
6. Parar quando a run atingir `ready_for_finalize` ou `blocked`.

## O que você nunca deve fazer

- Modificar qualquer arquivo fora de `/Auditoria/`.
- Modificar código-fonte, testes ou infraestrutura do projeto auditado.
- Iniciar nova run.
- Finalizar ou arquivar a run atual.
- Criar domínios novos.
- Pular fase sem justificativa explícita registrada como `phase_skipped` no ledger.
- Registrar achado sem evidência observável: pelo menos um de `evidence.file_path`, `evidence.command_used` ou `evidence.area` deve estar preenchido (não-null, não-vazio). Schema enforça via anyOf — achado sem evidência falha validação.
- Inventar contexto que não esteja presente nos arquivos do projeto.
- Tratar profundidade, velocidade ou abrangência como variáveis. Auditoria não tem modo: a profundidade é a que o playbook define, sempre. Modos "rápido", "superficial" ou "priorizar alguns itens" não existem — ofertar ou aplicar produz resultado inválido.
- Pausar a execução para consultar o usuário sobre escopo, profundidade, quantidade de achados ou se vale continuar. Os únicos gates legítimos de interação humana estão no BEGIN (Regra 4) e no Prompt 04. Qualquer outra pausa para negociar escopo é defeito.
- Reescrever linhas anteriores do `phase-ledger.jsonl` (é append-only).

**Arquivos fora de `/Auditoria/` são estritamente somente leitura.**

---

# Etapa 1 — Identificar a run ativa

Leia `/Auditoria/_framework/audit-index.json` e procure em `domains[]`:

- algum domínio com `status_current` em `in_progress` ou `blocked` → este é o `<dominio>` ativo

Se nenhum domínio tem run ativa:

```
Não há run ativa.
Execute o Prompt 02 — Iniciar Run primeiro.
```

**Encerre sem alterar arquivos.**

Se mais de um domínio tem run ativa, peça confirmação ao usuário sobre qual continuar.

---

# Etapa 2 — Leitura do estado da run

Leia, do domínio identificado:

1. `/Auditoria/<dominio>/current/run.json`
2. `/Auditoria/<dominio>/current/state.json`
3. `/Auditoria/<dominio>/current/findings.json`
4. `/Auditoria/<dominio>/current/report.json`
5. (cabeçalho do) `/Auditoria/<dominio>/current/phase-ledger.jsonl`

Extraia de `run.json`:

- `run_id`, `status`, `capability_tier_declarado`, `playbook_version`, `framework_version`

Extraia de `state.json`:

- `objetivo`, `escopo`, `phases[]` (cada fase com seu `status`), `fase_atual`, `open_blockers`, `proximo_passo_obrigatorio`

## Validação de estado

| `run.json.status`         | Ação                                                                      |
|---------------------------|---------------------------------------------------------------------------|
| `not_started`             | informe usuário, oriente Prompt 02. **Encerre sem alterar.**              |
| `ready_for_finalize`      | informe usuário, oriente Prompt 04. **Encerre sem alterar.**              |
| `completed` / `archived`  | run já foi encerrada. **Encerre sem alterar.**                            |
| `blocked`                 | rota de **desbloqueio** abaixo (Etapa 2.1). Só prossiga depois de limpar os blockers. |
| `in_progress`             | prossiga para Etapa 3.                                                    |

## Etapa 2.1 — Desbloqueio (apenas se `run.json.status: "blocked"`)

Para cada item em `state.open_blockers[]` que tem `decision: null` (ainda aberto):

1. Leia `id`, `phase`, `context`. Apresente ao usuário e pergunte como resolver.
2. Aguarde a decisão (texto livre descrevendo o que foi feito).
3. Atualize o blocker:
   - `decision`: texto da resposta do usuário
   - `resolved_at`: timestamp ISO atual
4. Append no `phase-ledger.jsonl`:
   ```json
   {"format_version":1,"ts":"<TIMESTAMP_ISO>","event":"blocker_resolved","blocker_id":"<BLK-NNN>","decision":"<texto>"}
   {"format_version":1,"ts":"<TIMESTAMP_ISO>","event":"phase_unblocked","phase":"<fase-NN>","blocker_id":"<BLK-NNN>"}
   ```
5. **Aplique a Regra de Limpeza de Fase** (definida abaixo) à fase do blocker antes de marcá-la como `pendente`.

Quando **todos** os blockers em `open_blockers[]` tiverem `decision` preenchida (continuam no array como histórico, mas resolvidos):

- `state.blocked = false`
- `run.json.status: "in_progress"`
- Append no ledger: `{"format_version":1,"ts":"<TIMESTAMP_ISO>","event":"run_status_changed","from":"blocked","to":"in_progress","reason":"<síntese das decisões>"}`
- Atualize `audit-index.json.domains[<dominio>].status_current: "in_progress"` e `updated_at`.

Se o usuário **não** souber como resolver algum blocker, **encerre sem alterar** — a run permanece em `blocked`. Não force decisão.

Após desbloqueio bem-sucedido, prossiga para Etapa 3.

### Regra de Limpeza de Fase (reutilizada na Etapa 2.1 e na Etapa 4.0)

Quando uma fase precisa ser **re-executada do zero** (foi bloqueada e desbloqueada, ou foi interrompida no meio), os achados parciais que ela já registrou em `findings.json` precisam ser **removidos** antes da re-execução — caso contrário, a re-execução vai criar duplicatas (ACH-005 da execução anterior + ACH-008 novo apontando para o mesmo problema).

Para a fase `<fase-NN>` que está sendo re-executada:

1. Leia `findings.json`.
2. **Remova** todos os itens onde `findings[i].phase == "<fase-NN>"`. Os IDs **não são renumerados** — buracos na sequência (ACH-005, ACH-006 sumiram; próximo ainda será ACH-007 normalmente). Manter imutabilidade dos IDs evita invalidar referências em commits ou outras ferramentas externas.
3. Atualize `findings.ultima_atualizacao` para o timestamp atual.
4. Em `state.phases[<idx>]`:
   - `status: "pendente"`
   - `started_at: null`
   - `completed_at: null`
   - `checks_executados: 0`
   - `findings_created: []`
   - `limitations: []`
5. Append no ledger uma `note` documentando a limpeza:
   ```json
   {"format_version":1,"ts":"<TIMESTAMP_ISO>","event":"note","phase":"<fase-NN>","message":"limpeza de fase para re-execução: <N> achados removidos (IDs: <lista>)"}
   ```

Esta regra é determinística e idempotente — aplicar duas vezes na mesma fase tem o mesmo efeito que aplicar uma vez.

---

# Etapa 3 — Leitura do playbook

Leia `/Auditoria/_framework/playbooks/<dominio>.playbook.md`.

Se o arquivo não existir:

- Append no ledger: `phase_blocked` (não tem fase ativa para indicar; use `state.fase_atual` ou `fase-01`).
- Atualize `run.json.status` para `blocked`.
- Atualize `state.json.blocked = true` e adicione um blocker em `open_blockers[]`.
- Atualize `audit-index.json` (status_current = blocked).
- Informe usuário e **encerre**.

Do playbook, extraia:

- Ordem Oficial das Fases (já refletida em `state.phases[]` desde o Prompt 02 — não reordenar)
- Para cada fase: objetivo, checks obrigatórios, evidências esperadas, possíveis achados, critério de conclusão, condições de bloqueio
- Critérios para `ready_for_finalize`
- Situações Típicas de Bloqueio
- Regras Gerais do Domínio

---

# Etapa 4 — Execução das fases

## Detecção de retomada parcial (ANTES de iniciar a próxima fase)

Antes de iniciar qualquer fase, percorra `state.phases[]` procurando entradas com `status: "em_andamento"`. Esse status indica que uma fase começou em execução anterior do P03 que foi interrompida antes de concluir, bloquear ou marcar N/A.

Para cada fase nesse estado:

1. **Aplique a Regra de Limpeza de Fase** (definida na Etapa 2.1) — remove achados parciais e reseta a fase para `pendente`.
2. Append no ledger: `{"format_version":1,"ts":"<TIMESTAMP_ISO>","event":"note","phase":"<fase-NN>","message":"retomada após interrupção: fase reset para pendente"}`.

**Não tente continuar de onde a fase parou** — o framework v4 trabalha em granularidade de fase, não de check individual. Re-executar do zero é determinístico e barato; tentar reconstruir o ponto exato exigiria parsing complexo do ledger e introduziria fragilidade.

Após a limpeza, atualize `state.fase_atual` para a primeira fase com `status: "pendente"` na ordem oficial.

## Início da execução

Comece pela fase indicada em `state.fase_atual`. Se uma fase já estiver `concluida` ou `nao_aplicavel`, avance para a próxima `pendente`.

## Guardrail de modelo — OBRIGATÓRIO

Este prompt declara `capability_tier: frontier` no frontmatter. Análise semântica de código exige o modelo de maior capacidade da plataforma atual (Opus em Anthropic, GPT-5 ou o1-pro em OpenAI, Gemini 2.5 Pro em Google, etc.). Modelos inferiores alucinam evidências e reclassificam severidades subjetivamente.

**Se a plataforma oferecer o sub-agente `audit-phase-analyzer`** (disponível em Claude Code), **delegue cada fase a esse sub-agente** — ele é fixado em frontier tier e garante o modelo correto mesmo sob orquestração paralela.

**Se não houver suporte a sub-agentes**, execute diretamente respeitando o tier declarado.

Registre o modelo ativo em `run.json.model_ativo` (uma vez, ao iniciar a run) e no evento `run_started` do ledger (anexado pelo Prompt 02). Eventos posteriores como `phase_completed` **não** carregam `model_ativo` — o doctor reconstrói a relação modelo↔fase via timestamp do `run_started` (a run inteira roda num modelo só; se mudar, exigirá nova run).

## 4.1 — Anunciar a fase

Para cada fase pendente:

```
Executando: <NOME_DA_FASE>
Domínio: <dominio>
Run ID: <run_id>
Fase: <fase-NN>
```

Append no ledger:

```json
{"format_version":1,"ts":"<TIMESTAMP_ISO>","event":"phase_started","phase":"<fase-NN>","phase_name":"<NOME_DA_FASE>"}
```

Atualize `state.json.phases[<idx>].started_at` e `state.json.phases[<idx>].status = "em_andamento"`. Atualize `state.atualizado_em` e `state.fase_atual`.

## 4.2 — Executar os checks

Para cada check obrigatório listado no playbook para esta fase:

1. Leia os arquivos e áreas relevantes do repositório (somente leitura).
2. Analise com base no que está presente — nunca suponha.
3. Se não houver evidência suficiente para um check, registre como **limitação** (acrescente em `state.phases[<idx>].limitations[]`), não como achado confirmado.
4. Se um check não se aplicar ao projeto, registre como `phase_skipped` no ledger com `reason` objetivo e marque o item como N/A no contexto da fase.

Você pode também append `check_executed` no ledger por check (formato abaixo) — isso enriquece observabilidade. **Opcional** por check individual; **obrigatório** por fase via `phase_completed`.

Formato de `check_executed` (campos exigidos pelo schema):

```json
{"format_version":1,"ts":"<TIMESTAMP_ISO>","event":"check_executed","phase":"<fase-NN>","check_id":"<check-NN ou ID livre>","files_analyzed":["<path>"],"command_used":"<cmd ou null>","result":"<ok|achado|limitacao|nao_aplicavel ou null>"}
```

## 4.3 — Registrar achados

Para cada problema identificado com evidência real, **acrescente** ao array `findings` em `findings.json`:

```json
{
  "id": "ACH-<SEQUENCIAL_NA_RUN>",
  "phase": "<fase-NN>",
  "titulo": "<TITULO_CURTO>",
  "categoria": "<CATEGORIA_COMPATIVEL_COM_O_DOMINIO>",
  "severidade": "<critico|alto|medio|baixo|informativo>",
  "status": "aberto",
  "criterio_do_playbook": "<fase-NN.check-NN ou fase-NN>",
  "resumo": "<DESCRICAO_OBJETIVA>",
  "evidence": {
    "file_path": "<CAMINHO_ABSOLUTO_OU_RELATIVO_AO_REPO>",
    "line_start": <LINHA_INICIAL_OU_NULL>,
    "line_end": <LINHA_FINAL_OU_NULL>,
    "snippet": "<TRECHO_CURTO_OU_NULL>",
    "command_used": "<COMANDO_QUE_LEVANTOU_A_EVIDENCIA_OU_NULL>",
    "area": "<AREA_LOGICA_QUANDO_NAO_HA_ARQUIVO_UNICO_OU_NULL>"
  },
  "impacto": {
    "tecnico": "<IMPACTO_TECNICO>",
    "negocio": "<IMPACTO_NO_NEGOCIO_OU_OPERACAO>"
  },
  "recomendacao": "<ACAO_CONCRETA>",
  "limitacoes": [],
  "score": {
    "confidence": "<confirmado|provavel|hipotese>",
    "evidence_quality": "<forte|media|fraca>",
    "impacto_nivel": "<alto|medio|baixo>",
    "probabilidade": "<alta|media|baixa>",
    "esforco": "<XS|S|M|L|XL>",
    "causa_raiz": "<string-em-kebab-case-ou-null>"
  },
  "criado_em": "<TIMESTAMP_ISO>",
  "atualizado_em": "<TIMESTAMP_ISO>"
}
```

Atualize `findings.ultima_atualizacao` ao adicionar.

Append no ledger por achado criado:

```json
{"format_version":1,"ts":"<TIMESTAMP_ISO>","event":"finding_created","finding_id":"ACH-NNN","phase":"<fase-NN>","severidade":"<sev>","criterio_do_playbook":"<criterio>"}
```

### Regra anti-alucinação (enforced no schema)

`evidence` precisa de pelo menos uma de: `file_path`, `command_used` ou `area` preenchida (não-null e não-vazia). Achado sem nenhuma das três **falha o schema** (anyOf em `findings.schema.json`) — registre como **limitation** em `state.phases[<idx>].limitations[]`, não como finding.

`confidence: confirmado` exige evidência reproduzível (`file_path` + `line_*` ou `command_used`). Se for inferência ou cheiro, use `confidence: provavel` ou `hipotese`.

### Regra de score

`impacto_nivel` é **opcional** no schema — pode ser `null` se você não quiser desacoplar do `severidade`. Quando preenchido, escolha o valor que faz sentido independente da severidade técnica. `causa_raiz` em kebab-case agrupa achados pela mesma origem (`validacao-ausente`, `secret-management`, `tenant-isolation`) — útil para correção em batch.

### Numeração

`id` é `ACH-<NNN>` sequencial **dentro da run** (ACH-001, ACH-002, …). Nunca duplicar. Nunca pular números. Sempre use 3+ dígitos.

## 4.4 — Concluir, bloquear ou pular a fase

Após executar todos os checks, avalie o critério de conclusão definido no playbook.

### Critério atendido — concluir fase

Atualize `state.json.phases[<idx>]`:

- `status: "concluida"`
- `completed_at: "<TIMESTAMP_ISO>"`
- `checks_executados: <NUMERO>`
- `findings_created: ["ACH-NNN", ...]`
- `limitations: [...]`

Append no ledger:

```json
{"format_version":1,"ts":"<TIMESTAMP_ISO>","event":"phase_completed","phase":"<fase-NN>","checks_executados":<N>,"files_analyzed":["<path1>","<path2>"],"findings_created":["ACH-NNN"],"limitations":["<limitacao>"]}
```

Atualize `state.fase_atual` para a próxima fase pendente. Avance.

### Bloqueio encontrado — fase bloqueada

Crie um blocker:

- `id: "BLK-<NNN>"` sequencial na run
- `phase: "<fase-NN>"`
- `context: "<descrição objetiva do impedimento>"`
- `decision: null`
- `registered_at: "<TIMESTAMP_ISO>"`
- `resolved_at: null`

Adicione a `state.open_blockers[]` e marque `state.blocked = true`.

Atualize `state.json.phases[<idx>].status = "bloqueada"`.

Atualize `run.json.status = "blocked"`.

Append dois eventos no ledger:

```json
{"format_version":1,"ts":"<TIMESTAMP_ISO>","event":"blocker_opened","blocker_id":"BLK-NNN","phase":"<fase-NN>","context":"<contexto>"}
{"format_version":1,"ts":"<TIMESTAMP_ISO>","event":"phase_blocked","phase":"<fase-NN>","blocker_id":"BLK-NNN"}
{"format_version":1,"ts":"<TIMESTAMP_ISO>","event":"run_status_changed","from":"in_progress","to":"blocked","reason":"<contexto curto>"}
```

Atualize `audit-index.json.domains[<dominio>].status_current = "blocked"` e `audit-index.updated_at`.

Informe usuário sobre o bloqueio e **encerre**.

### Fase não aplicável

Atualize `state.json.phases[<idx>].status = "nao_aplicavel"`, `skip_reason = "<justificativa>"`.

Append no ledger:

```json
{"format_version":1,"ts":"<TIMESTAMP_ISO>","event":"phase_skipped","phase":"<fase-NN>","reason":"<justificativa>"}
```

Avance.

## 4.5 — Regenerar `report-consolidado.json` (opcional, opt-in)

Após concluir cada fase, **opcionalmente** regenere o relatório consolidado para alimentar dashboards externos em tempo real.

**Identifique `<RAIZ_PROJETO_ALVO>`**:

```bash
RAIZ_PROJETO_ALVO="$(pwd)"
while [ "$RAIZ_PROJETO_ALVO" != "/" ] && [ ! -d "$RAIZ_PROJETO_ALVO/Auditoria" ]; do
  RAIZ_PROJETO_ALVO="$(dirname "$RAIZ_PROJETO_ALVO")"
done
```

Execute:

```bash
"$RAIZ_PROJETO_ALVO/.audkit" report "$RAIZ_PROJETO_ALVO" --include-current
```

Tratamento de erro:

- Se `.audkit` não existir: pule silenciosamente. O Prompt 04 vai gerar o report ao finalizar.
- Se `.audkit` existir mas falhar: registre como `note` no ledger e siga. Não interrompa a run.

**Commit automático: opt-in via env var `AUDKIT_AUTO_COMMIT`.**

Por padrão, esta sub-etapa apenas atualiza arquivos locais. Commits e push acontecem no Prompt 04 (um ponto de publicação por domínio em vez de um por fase — evita flood).

Se `AUDKIT_AUTO_COMMIT=1`:

```bash
git add Auditoria/
git commit -m "chore(auditoria): <dominio> <fase> — progresso automático"
```

**Nunca** push automático aqui. Push consolidado é responsabilidade do Prompt 04.

---

# Etapa 5 — Atualização contínua do `report.json`

Atualize `/Auditoria/<dominio>/current/report.json` progressivamente:

- A cada novo achado: incrementa o contador correspondente em `consolidacao_por_severidade` e em `consolidacao_por_categoria` (chave = `categoria` do achado).
- `atualizado_em`: a cada modificação.

**Não preencha** `resumo_executivo`, `avaliacao` e `conclusoes` durante a execução das fases técnicas — esses campos são preenchidos na fase de Consolidação (Etapa 6).

---

# Etapa 6 — Consolidação de achados

Quando todas as fases técnicas do playbook estiverem `concluida` ou `nao_aplicavel`, execute a fase de consolidação conforme definida no playbook.

Na consolidação:

1. Revise todos os achados em `findings.json`.
2. Remova duplicidades (achados que apontam para a mesma evidência e mesma causa-raiz).
3. Confirme severidades à luz do conjunto.
4. Separe achados que pertencem a outros domínios (mude `status` para `nao_aplicavel` ou anote em `limitacoes` do achado).
5. Atualize `findings.json.ultima_atualizacao`.
6. Recalcule `report.consolidacao_por_severidade` e `consolidacao_por_categoria` com o conjunto final.

---

# Etapa 7 — Preparação para finalização

Quando a consolidação estiver concluída:

1. Preencha em `report.json`:
   - `resumo_executivo`: parágrafo claro sobre o estado do domínio
   - `avaliacao.score`: número 0–10 alinhado com a Avaliação Geral do playbook (`adequado` ≈ 8–10, `aceitavel_com_ressalvas` ≈ 5–7, `preocupante` ≈ 3–5, `critico` ≈ 0–3)
   - `avaliacao.nota_qualitativa`: string curta (ex.: `"adequado"`, `"preocupante"`)
   - `conclusoes`: string com observações finais
   - `pronto_para_finalizar: true`

2. Verifique critérios de `ready_for_finalize` conforme o playbook:
   - Todas as fases `concluida` ou `nao_aplicavel`.
   - Sem `state.open_blockers` sem `decision`.
   - `findings.json` consolidado.
   - `report.json` com os campos acima preenchidos.

3. Se todos os critérios atendidos:
   - `run.json.status = "ready_for_finalize"`
   - `state.proximo_passo_obrigatorio = "executar Prompt 04 — Finalizar Run"`
   - Append no ledger:
     ```json
     {"format_version":1,"ts":"<TIMESTAMP_ISO>","event":"run_status_changed","from":"in_progress","to":"ready_for_finalize"}
     ```
   - Atualize `audit-index.json.domains[<dominio>].status_current = "ready_for_finalize"` e `updated_at`.

4. Se algum critério não atender:
   - Liste em `report.bloqueadores_para_finalizar[]`.
   - Não mude o status para `ready_for_finalize`.

---

# Etapa 8 — Confirmação ao usuário

Quando atingir `ready_for_finalize`:

```
Auditoria concluída.

Domínio: <dominio>
Run ID:  <run_id>
Status:  ready_for_finalize

Resumo:
- Fases executadas: <N>
- Achados registrados: <TOTAL>
  - Críticos:     <N>
  - Altos:        <N>
  - Médios:       <N>
  - Baixos:       <N>
  - Informativos: <N>

Avaliação geral: <nota_qualitativa> (score: <score>)

Próximo passo:
Execute o Prompt 04 — Finalizar Run para arquivar esta auditoria.
```

Quando atingir `blocked`:

```
Execução interrompida.

Domínio: <dominio>
Run ID:  <run_id>
Status:  blocked

Fase bloqueada: <fase>
Motivo: <contexto>

Próximo passo:
Resolva o impedimento e execute o Prompt 03 novamente para retomar.
```

---

# Regras gerais de execução

1. Não inventar contexto — trabalhar apenas com evidência real do repositório.
2. Não modificar arquivos fora de `/Auditoria/`.
3. Não executar mais de uma run por execução.
4. Não pular fase sem registrar `phase_skipped` no ledger.
5. Não registrar achado sem `evidence.file_path` ou `evidence.command_used` ou `evidence.area`.
6. Não avançar de fase sem persistir progresso (atualizar `state.json` + append `phase_completed` no ledger).
7. Não finalizar a run — isso é responsabilidade do Prompt 04.
8. Sempre definir `state.proximo_passo_obrigatorio` antes de encerrar.
9. O estado oficial da run está nos JSONs — nunca na memória da conversa.
10. Cada escrita de JSON deve manter `format_version: 1` e validar contra o schema.
11. Cada linha do ledger deve ser um JSON único (sem quebras de linha internas) com `format_version: 1`.

---

# Critério de conclusão desta execução

A execução só pode encerrar quando uma das condições for verdadeira:

1. **Run em `ready_for_finalize`**: todas as fases concluídas, consolidação feita, `report.json` preenchido com `pronto_para_finalizar: true`, usuário informado, Prompt 04 recomendado.

2. **Run em `blocked`**: impedimento real registrado em `state.open_blockers[]`, ledger com `blocker_opened` + `phase_blocked` + `run_status_changed`, usuário informado.

3. **Nenhuma run ativa**: usuário informado, nenhum arquivo alterado.

4. **Run em estado incompatível**: usuário informado, nenhum arquivo alterado.

Em nenhuma hipótese a execução deve encerrar com:

- progresso de fase não persistido (state.json desatualizado em relação ao ledger)
- `state.proximo_passo_obrigatorio` indefinido
- achado sem ID sequencial
- fase concluída sem `phase_completed` no ledger
