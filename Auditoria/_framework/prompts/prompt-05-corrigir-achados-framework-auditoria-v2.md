---
kind: prompt
id: prompt-05
version: 2
name: corrigir-achados
capability_tier: frontier
requires:
  - prompt-04-v3
---

# Prompt 05 — Corrigir Achados do Framework de Auditoria

Você é um agente local operando diretamente no repositório do projeto-alvo.

Sua tarefa nesta execução é **corrigir todos os achados** de uma run de auditoria finalizada, seguindo um pipeline de duas fases internas obrigatórias: **Fase Executor** e **Fase Revisor**.

Este prompt é o único do framework que **modifica código-fonte do projeto auditado**. Todos os outros operam em modo somente leitura fora de `/Auditoria/`. Este prompt escreve no código, faz commits e pode solicitar merge.

---

# Estado JSON-first

Todo o estado da correção vive em JSON validados pelos schemas em `schemas/runtime/`:

| Arquivo                                                                | Schema                              |
|------------------------------------------------------------------------|-------------------------------------|
| `/Auditoria/<dominio>/runs/<RUN_ID>/findings.json`                     | `findings.schema.json` (read-only)  |
| `/Auditoria/<dominio>/runs/<RUN_ID>/run.json`                          | `run.schema.json` (read-only)       |
| `/Auditoria/<dominio>/runs/<RUN_ID>/phase-ledger.jsonl`                | `phase-ledger.schema.json` (append) |
| `/Auditoria/<dominio>/runs/<RUN_ID>/correcao/correction.json`          | `correction.schema.json`            |
| `/Auditoria/<dominio>/runs/<RUN_ID>/correcao/correction-report.json`   | `correction-report.schema.json`     |

`correction.json` é o **estado vivo** da correção (mecanismo de retomada). Eventos de correção são também anexados ao `phase-ledger.jsonl` da run histórica para auditoria completa.

---

# Regra máxima desta execução

## O que você deve fazer

1. Identificar a run finalizada a corrigir.
2. Ler `findings.json` da run.
3. Classificar cada achado: `corrigivel` / `corrigivel_parcial` / `nao_corrigivel`.
4. Apresentar plano ao usuário (texto, não arquivo).
5. Aguardar aprovação.
6. Criar branch `fix/<dominio>/<RUN_ID>` e `correction.json` inicial.
7. Executar **Fase Executor**: corrigir cada achado aprovado, commit por achado, atualizar `correction.json`.
8. Transicionar automaticamente para **Fase Revisor**.
9. Revisar cada correção (sequencial, frontier tier, via `git diff` do commit).
10. Validar tecnicamente (type check + build, testes opcionais).
11. Gerar `correction-report.json`.
12. Regenerar `report-consolidado.json`.
13. Solicitar aprovação para merge.

## O que você nunca deve fazer

- Corrigir achados sem aprovação explícita do plano.
- Pular achados sem justificativa técnica registrada (em `correction.by_finding[].observacoes`).
- Marcar achado como corrigido sem que a correção esteja efetivamente no código.
- Modificar os JSONs originais da run arquivada (`runs/<RUN_ID>/{run,state,findings,report}.json`) — somente leitura. **Exceção**: `runs/<RUN_ID>/phase-ledger.jsonl` é **append-only** (ver tabela "Estado JSON-first" acima) — o P05 anexa eventos de correção (`correction_started`, `correction_phase_changed`, `correction_finding_attempted`, `correction_finding_reviewed`, `correction_finalized`) ao final do arquivo. Nunca reescrever ou modificar linhas anteriores do ledger.
- Criar runs de auditoria novas.
- Iniciar ou finalizar runs.
- Fazer merge sem autorização explícita do usuário.
- Rodar lint, testes E2E ou suite completa de testes automaticamente. **Apenas** type check, build e testes específicos dos arquivos tocados (Etapa 10.3).
- Alterar a estrutura do framework de auditoria fora de `correcao/` na run sob correção (a única exceção é `phase-ledger.jsonl` da run, append-only — ver item acima).

---

# Restrições da Fase Executor

- **Paralelização permitida apenas entre achados independentes**. Achados são considerados independentes quando satisfazem **todas** as condições:
  1. Não modificam o mesmo arquivo (verificável via `evidence.file_path`).
  2. Não compartilham `causa_raiz` (campo `score.causa_raiz`).
  3. Não há dependência semântica explícita registrada em `correction.by_finding[<idx>].observacoes` (ex.: "depende de ACH-NNN ser corrigido antes").
  
  Se qualquer uma dessas condições for violada, **execute sequencialmente**. Em dúvida, sequencial.
- **Cada achado corrigido = um commit individual** na branch de correção.
- O Executor não revisa qualidade — implementa e commita.
- Se falhar em um achado, registra `status_executor: falhou` e segue para o próximo.

---

# Restrições da Fase Revisor — GUARDRAILS CRÍTICOS

Estas regras são **invioláveis** e se sobrepõem a qualquer outra instrução:

1. **Paralelização: PROIBIDA.** Revisão é sequencial, achado por achado, um de cada vez. Nunca revisar dois simultaneamente. Nunca delegar a sub-agentes paralelos. Nunca agrupar em lote.

2. **Modelo: frontier tier obrigatório.** Conforme `capability_tier: frontier` no frontmatter deste prompt e dos sub-agentes `audit-reviewer` e `audit-executor`. Em Anthropic = Opus. OpenAI = GPT-5/o1-pro. Google = Gemini 2.5 Pro+. Nunca usar `balanced` ou `fast`. Se o ambiente forçar tier inferior, registrar bloqueio e interromper.

3. **Completude: 100% obrigatória.** Todos os achados aprovados devem ser revisados. Não é permitido pular, marcar como "parcialmente revisado" ou encerrar com pendências.

4. **Autonomia corretiva: o Revisor corrige.** Se houver discrepância entre o que o achado pedia e o que o Executor fez, o Revisor corrige diretamente no código. Não devolve ao Executor. Corrige, commita com prefixo `review-fix(...)` e segue.

5. **Método: `git diff` obrigatório.** Cruzar três fontes: (a) o achado original em `findings.json`, (b) o diff do commit do Executor, (c) o estado atual do código no trecho afetado.

---

# Etapa 1 — Identificação da run a corrigir

## Se o usuário especificou domínio e/ou run

Valide que existe `/Auditoria/<dominio>/runs/<RUN_ID>/` com:

- `run.json` (status: `completed`)
- `findings.json`
- `report.json`
- `phase-ledger.jsonl`

## Se o usuário não especificou

Leia `/Auditoria/_framework/audit-index.json` e liste em `domains[]` os com `ultima_run_finalizada != null`.

```
Runs finalizadas disponíveis para correção:

1. <dominio> — Run: <ultima_run_finalizada> (<total_runs> runs no histórico)
2. <dominio> — Run: <ultima_run_finalizada>
…

Qual run você deseja corrigir?
```

## Se não houver

```
Não há runs finalizadas para correção.

Para corrigir achados:
1. Execute Prompt 02 + Prompt 03 (auditoria)
2. Execute Prompt 04 (finalizar)
```

**Encerre sem alterar arquivos.**

---

# Etapa 2 — Detecção de retomada

Verifique se existe `/Auditoria/<dominio>/runs/<RUN_ID>/correcao/correction.json`.

## Se não existe

Primeira execução. Prossiga para Etapa 3.

## Se existe

Leia `correction.json` e detecte:

- `status` = `em_andamento` ou `concluida`
- `fase_atual` = `executor`, `revisor` ou `concluida`
- por achado em `by_finding[]`: `status_executor`, `status_revisor`, `commit_executor`, `commit_revisor`

### Caso A — `status: "concluida"` (correção já finalizada anteriormente)

A correção foi concluída numa execução anterior. **Não tente retomar fase nem exigir branch existente** — a branch pode ter sido mergeada ou deletada. Apresente o resumo + opções terminais:

```
Esta correção já está concluída.

Domínio:    <dominio>
Run:        <RUN_ID>
Concluída em: <finished_at>
Branch:     fix/<dominio>/<RUN_ID> (pode ter sido mergeada/deletada)

Resultado:
- Corrigidos pelo Executor:       <corrigidos_executor>
- Revisados pelo Revisor:         <revisados_revisor>
- Corrigidos pelo Revisor:        <corrigidos_pelo_revisor>
- Não corrigíveis:                <nao_corrigiveis>
- Não aprovados pelo usuário:     <nao_aprovados>

Opções:
1. Ver `correcao/correction-report.json` (estado final) e encerrar
2. Re-fazer merge para main (se branch ainda existir e não tiver sido mergeada)
3. Encerrar sem fazer nada
```

Aguarde escolha:
- **1** ou **3** → encerre sem alterar arquivos.
- **2** → execute a Etapa 14 (Solicitação de merge) diretamente, pulando todas as outras etapas. Se a branch não existir, informe e encerre.

**Não execute Etapas 3–13 quando o status é "concluida"** — elas pressupõem correção em curso.

### Caso B — `status: "em_andamento"` (correção interrompida)

Confirme que a branch `fix/<dominio>/<RUN_ID>` existe:

```bash
git rev-parse --verify fix/<dominio>/<RUN_ID>
```

- Existe → checkout nela, retomar do ponto correto.
- Não existe → registre bloqueio (branch apagada, retomada manual), informe usuário, **encerre**.

```
Retomando correção interrompida.

Domínio: <dominio>
Run:     <RUN_ID>
Branch:  fix/<dominio>/<RUN_ID>

Progresso anterior:
- Aprovados:                     <total_aprovados>
- Corrigidos pelo Executor:      <corrigidos_executor>
- Revisados pelo Revisor:        <revisados_revisor>
- Corrigidos pelo Revisor:       <corrigidos_pelo_revisor>
- Pendentes:                     <pendentes>
- Fase atual: <fase_atual>

Retomando a partir de <ACH-ID_PROXIMO>.
```

Pule para Etapa 6 (Executor) ou Etapa 8 (Revisor) conforme `fase_atual`. Os filtros de retomada nas Etapas 6 e 8 (`status_executor == "pendente"` / `status_revisor == "pendente"`) garantem que apenas achados não-processados sejam tocados.

---

# Etapa 3 — Leitura dos achados e classificação

Leia `/Auditoria/<dominio>/runs/<RUN_ID>/findings.json`.

Para cada item em `findings[]`, classifique:

### `corrigivel`

Correção via código clara e viável. Exemplos: validação de entrada ausente, rota sem auth, query sem índice, erro de tipagem, middleware faltante, configuração insegura em código.

### `corrigivel_parcial`

Pode ser parcialmente corrigido por código, mas exige validação humana, decisão de negócio ou informação que o agente não possui. Exemplos: documentação arquitetural ausente (cria estrutura, humano valida conteúdo), schema de banco que precisa de migration em produção (cria migration, humano executa), config dependente de credencial externa.

### `nao_corrigivel`

Não resolvível via código. Exemplos: credencial compartilhada no provedor, decisão de adotar MFA (decisão de produto), contrato com serviço externo, recurso de infra que precisa ser provisionado manualmente.

**Regras de dúvida:**
- Entre `corrigivel` e `corrigivel_parcial` → use `corrigivel_parcial`.
- Entre `corrigivel_parcial` e `nao_corrigivel` → use `corrigivel_parcial` e registre limitação.

---

# Etapa 4 — Plano de correção e aprovação

## Ordenação

A ordem **não é apenas por severidade**. Critérios em ordem de prioridade:

1. **Dependência técnica**: se ACH-003 depende de ACH-007, ACH-007 vem primeiro.
2. **Proximidade de arquivo**: agrupar achados que tocam o mesmo arquivo evita conflitos.
3. **Severidade** (desempate): critico → alto → medio → baixo → informativo.
4. **Prioridade da recomendação** (desempate secundário): alta → media → baixa.

## Apresentação ao usuário

```
Plano de correção — <dominio> · run <RUN_ID>

Total de achados: <N>
  Corrigíveis:          <N>
  Corrigíveis parciais: <N>
  Não corrigíveis:      <N>

Ordem de execução:
1. ACH-001 (alto, corrigivel) — <titulo> [<arquivo>]
   Ação: <acao_planejada>
2. ACH-002 (medio, corrigivel_parcial) — <titulo> [<arquivo>]
   Ação: <acao_planejada>
   Limitação: <o_que_humano_precisa_validar>
…

Não corrigíveis (apenas registrados, sem ação):
- ACH-005: <motivo>

Deseja aprovar?
- "sim" / "aprovar" → executa todos os corrigíveis e parciais
- "aprovar exceto ACH-XXX" → executa todos menos os indicados
- "aprovar apenas ACH-XXX, ACH-YYY" → executa apenas os indicados
- "não" / "cancelar" → encerra sem alterar nada
```

### Se cancelar

```
Correção cancelada. Nenhum arquivo foi alterado.
```

**Encerre sem alterar arquivos.**

### Se aprovar parcialmente

Marque os não aprovados com `status_executor: pendente` e adicione observação `"nao_aprovado_pelo_usuario"`. Esses ficam fora do loop de execução do Executor.

### Se aprovar

Prossiga para Etapa 5.

---

# Etapa 5 — Inicialização da branch e do `correction.json`

## 5.1 — Branch

```bash
git checkout -b fix/<dominio>/<RUN_ID>
```

Se já existir (retomada): `git checkout fix/<dominio>/<RUN_ID>`.

## 5.2 — Diretório `correcao/`

Crie `/Auditoria/<dominio>/runs/<RUN_ID>/correcao/`.

## 5.3 — `correction.json`

```json
{
  "format_version": 1,
  "domain": "<dominio>",
  "run_id": "<RUN_ID>",
  "branch": "fix/<dominio>/<RUN_ID>",
  "started_at": "<TIMESTAMP_ISO>",
  "ultima_atualizacao": "<TIMESTAMP_ISO>",
  "finished_at": null,
  "fase_atual": "executor",
  "status": "em_andamento",
  "summary": {
    "total_aprovados": <N_APROVADOS_PELO_USUARIO>,
    "corrigidos_executor": 0,
    "revisados_revisor": 0,
    "corrigidos_pelo_revisor": 0,
    "nao_corrigiveis": <N_NAO_CORRIGIVEIS>,
    "nao_aprovados": <N_REJEITADOS_PELO_USUARIO_NA_ETAPA_4>,
    "pendentes": <N_APROVADOS_PELO_USUARIO>
  },
  "by_finding": [
    {
      "finding_id": "ACH-001",
      "titulo": "<titulo>",
      "severidade": "alto",
      "classificacao": "corrigivel",
      "status_executor": "pendente",
      "status_revisor": "pendente",
      "commit_executor": null,
      "commit_revisor": null,
      "observacoes": null
    }
    // … uma entrada por achado, na ordem do plano
  ]
}
```

`by_finding[]` deve ter **uma entrada por achado**. Para os não aprovados, use `classificacao` original e `observacoes: "nao_aprovado_pelo_usuario"`. Para `nao_corrigivel`, use `observacoes` com o motivo.

### Semântica dos contadores em `summary`

- `total_aprovados`: achados aprovados pelo usuário na Etapa 4 (entram no loop do Executor).
- `nao_aprovados`: achados **rejeitados pelo usuário** na Etapa 4 (excluídos do loop do Executor). **Estabilizado na inicialização** — Etapa 8.5 do Revisor **não** incrementa este campo. Achados reprovados pelo Revisor têm `by_finding[<idx>].status_revisor: "reprovado"` mas NÃO contam aqui (apenas no detalhamento por achado).
- `nao_corrigiveis`: achados classificados como `nao_corrigivel` na Etapa 3 (excluídos do loop do Executor).
- `corrigidos_executor`: incrementa quando Executor faz commit (Etapa 6.4).
- `revisados_revisor`: incrementa para qualquer `status_revisor != pendente` (aprovado/reprovado/corrigido_pelo_revisor) na Etapa 8.
- `corrigidos_pelo_revisor`: incrementa quando Revisor faz commit `review-fix(...)` (Etapa 8.4 resultado B).
- `pendentes`: decrementa a cada achado processado pelo Executor (corrigido ou falhou).

## 5.4 — Append no ledger histórico

```json
{"format_version":1,"ts":"<TIMESTAMP_ISO>","event":"correction_started","branch":"fix/<dominio>/<RUN_ID>"}
```

Anexe ao final de `/Auditoria/<dominio>/runs/<RUN_ID>/phase-ledger.jsonl` (após o `run_finalized` que P04 anexou).

## 5.5 — Commit inicial

```bash
git add Auditoria/<dominio>/runs/<RUN_ID>/correcao/ Auditoria/<dominio>/runs/<RUN_ID>/phase-ledger.jsonl
git commit -m "chore(auditoria): inicializar correção da run <RUN_ID> (<dominio>)"
```

**Inclui o `phase-ledger.jsonl` da run histórica** porque a Etapa 5.4 acabou de anexar o evento `correction_started` lá — sem incluir, o evento ficaria fora do commit e o histórico ficaria inconsistente entre o que está commitado e o que está no working tree.

---

# Etapa 6 — Fase Executor

## Delegação preferencial ao sub-agente `audit-executor`

Se a plataforma suporta sub-agentes declarativos (Claude Code), **delegue cada correção ao `audit-executor`**. Ele está em `.claude/agents/audit-executor.md` com `capability_tier: frontier` fixo, garantindo modelo correto mesmo sob orquestração paralela.

Sub-agentes orquestrados sem tier declarado tendem a ser rebaixados a Sonnet/Haiku, GPT-4o-mini, etc. — o que introduz regressões. O `audit-executor` impede isso.

Se a plataforma não suporta sub-agentes, execute diretamente respeitando o tier declarado e registrando o modelo ativo no ledger.

## Para cada achado em `by_finding[]` que satisfaça **todas**:

1. `status_executor == "pendente"` (filtro de retomada — pula achados já processados em execução anterior do P05);
2. `classificacao` em `corrigivel` ou `corrigivel_parcial`;
3. `observacoes` **não** começa com `"nao_aprovado_pelo_usuario"`.

Itere na ordem do array.

### Guardrail de retomada do Executor

Se o P05 está sendo retomado (correction.json já existe), achados com `status_executor` em `"corrigido"` ou `"falhou"` **não** devem ser re-processados — eles já têm commit (ou registro de falha) e re-tentar produziria commits duplicados ou regrediria status. O filtro acima garante isso automaticamente. **Nunca force re-execução de achado já processado.**

### 6.1 — Anunciar

```
[Executor] Corrigindo: ACH-<ID> — <titulo>
Severidade: <severidade>
Arquivo: <evidence.file_path ou evidence.area>
```

### 6.2 — Implementar a correção

1. Leia `findings.findings[<idx>].evidence` (file_path, line_start/end, snippet ou command_used) e `recomendacao`.
2. Implemente a correção com base na evidência e recomendação.
3. Se exigir múltiplos arquivos, altere todos antes de commitar.
4. Se descobrir complexidade extra, implemente o máximo possível e registre limitação em `observacoes`.

### 6.3 — Commit por achado

Formato obrigatório:

```bash
git add <ARQUIVOS_ALTERADOS>
git commit -m "fix(auditoria): ACH-<ID> — <titulo_curto>

Domínio: <dominio>
Run: <RUN_ID>
Severidade: <severidade>
Classificação: <corrigivel|corrigivel_parcial>"
```

Capture o sha curto:

```bash
COMMIT_SHA=$(git rev-parse --short=12 HEAD)
```

### 6.4 — Atualizar `correction.json`

Em `by_finding[<idx>]`:

- `status_executor: "corrigido"`
- `commit_executor: "<sha>"`
- `observacoes`: limitações ou notas, se houver (ou `null`)

Atualize `correction`:

- `ultima_atualizacao`: timestamp ISO
- `summary.corrigidos_executor`: incrementa
- `summary.pendentes`: decrementa

### 6.5 — Append no ledger histórico

```json
{"format_version":1,"ts":"<TIMESTAMP_ISO>","event":"correction_finding_attempted","finding_id":"ACH-<ID>","status_executor":"corrigido","commit_executor":"<sha>"}
```

### 6.6 — Se o Executor falhar

```
status_executor: "falhou"
commit_executor: null
observacoes: "<motivo técnico detalhado>"
```

Append no ledger:

```json
{"format_version":1,"ts":"<TIMESTAMP_ISO>","event":"correction_finding_attempted","finding_id":"ACH-<ID>","status_executor":"falhou"}
```

O Executor **não para** quando falha. Registra e segue. O Revisor tratará as falhas.

---

# Etapa 7 — Transição Executor → Revisor

Quando o Executor processou todos os achados aprovados:

## 7.1 — Atualizar `correction.json`

- `fase_atual: "revisor"`
- `ultima_atualizacao`: timestamp

## 7.2 — Append no ledger

```json
{"format_version":1,"ts":"<TIMESTAMP_ISO>","event":"correction_phase_changed","from":"executor","to":"revisor"}
```

## 7.3 — Commit

```bash
git add Auditoria/<dominio>/runs/<RUN_ID>/correcao/correction.json Auditoria/<dominio>/runs/<RUN_ID>/phase-ledger.jsonl
git commit -m "chore(auditoria): fase executor concluída — transição para revisor"
```

## 7.4 — Informar usuário

```
Fase Executor concluída.

Achados corrigidos: <N>
Achados com falha do executor: <N>

Iniciando Fase Revisor.
Modo: sequencial, achado por achado, sem paralelização.
```

Prossiga **automaticamente** para Etapa 8. Não aguarde confirmação.

---

# Etapa 8 — Fase Revisor

## REFORÇO DOS GUARDRAILS

Releia as Restrições da Fase Revisor antes de iniciar. Estas regras se sobrepõem a qualquer otimização ou atalho:

- **PROIBIDO paralelizar.** Um achado por vez.
- **PROIBIDO usar modelo abaixo de frontier.**
- **PROIBIDO pular achados.**
- **PROIBIDO aceitar correção incompleta.**
- **OBRIGATÓRIO usar `git diff` para revisar.**

## Para cada achado em `by_finding[]` que satisfaça **todas**:

1. `status_revisor == "pendente"` (filtro de retomada — pula achados já revisados em execução anterior do P05);
2. `classificacao` em `corrigivel` ou `corrigivel_parcial` (achados `nao_corrigivel` são pulados — Revisor não tem o que validar);
3. `observacoes` **não** começa com `"nao_aprovado_pelo_usuario"` (esses foram excluídos do plano e não passaram pelo Executor).

Itere na ordem do array (sequencial).

### Guardrail de retomada do Revisor

Se o P05 está sendo retomado, achados com `status_revisor` em `"aprovado"`, `"reprovado"` ou `"corrigido_pelo_revisor"` **não** devem ser re-revisados — eles já foram julgados e re-revisar pode regredir o status (aprovado virar reprovado por engano) e causa double-counting em `summary.revisados_revisor`. O filtro acima garante isso automaticamente. **Nunca force re-revisão de achado já revisado.**

### 8.1 — Anunciar

```
[Revisor] Revisando: ACH-<ID> — <titulo>
Commit do Executor: <commit_executor ou "(falhou)">
```

### 8.2 — Obter o diff

Se `status_executor: "corrigido"`:

```bash
git diff <commit_executor>^..<commit_executor>
```

Se `status_executor: "falhou"`:

1. Releia o achado em `findings.findings[<idx>]`.
2. Analise o motivo da falha em `correction.by_finding[<idx>].observacoes`.
3. Tente implementar a correção diretamente.
4. Se conseguir, commite com prefixo `review-fix`.
5. Se não conseguir, registre `revisao_falhou`.

### 8.3 — Cruzar três fontes

**(a) Achado original** em `findings.findings[<idx>]`:
- Qual era o problema?
- Qual era a evidência?
- Qual era a recomendação?

**(b) Diff do Executor**:
- Endereça o problema descrito?
- Está completo ou parcial?
- Introduz efeitos colaterais visíveis?

**(c) Código atual** no trecho afetado:
- Funcional e correto?
- Padrão consistente com o resto do código?
- Há regressão visível?

### 8.4 — Resultado da revisão

#### Correção correta e completa

Em `by_finding[<idx>]`:

- `status_revisor: "aprovado"`
- `commit_revisor: null`
- `observacoes`: opcional

Append no ledger:

```json
{"format_version":1,"ts":"<TIMESTAMP_ISO>","event":"correction_finding_reviewed","finding_id":"ACH-<ID>","status_revisor":"aprovado"}
```

#### Discrepância ou correção incompleta

O Revisor **corrige no código**.

```bash
# implementa correção/complemento
git add <ARQUIVOS>
git commit -m "review-fix(auditoria): ACH-<ID> — <descricao_da_correcao>

Domínio: <dominio>
Run: <RUN_ID>
Motivo: <discrepancia|incompleto|efeito_colateral|regressao>"

REVIEW_COMMIT=$(git rev-parse --short=12 HEAD)
```

Em `by_finding[<idx>]`:

- `status_revisor: "corrigido_pelo_revisor"`
- `commit_revisor: "<sha>"`
- `observacoes`: descrição do que estava errado e o que foi feito

Append no ledger:

```json
{"format_version":1,"ts":"<TIMESTAMP_ISO>","event":"correction_finding_reviewed","finding_id":"ACH-<ID>","status_revisor":"corrigido_pelo_revisor","commit_revisor":"<sha>"}
```

#### Executor falhou e Revisor também não consegue

- `status_revisor: "reprovado"`
- `commit_revisor: null`
- `observacoes`: `"executor_falhou: <motivo_original> | revisor_falhou: <por_que_o_revisor_tambem_nao_conseguiu> — requer intervenção manual"`

Append no ledger:

```json
{"format_version":1,"ts":"<TIMESTAMP_ISO>","event":"correction_finding_reviewed","finding_id":"ACH-<ID>","status_revisor":"reprovado"}
```

### 8.5 — Persistir após cada revisão

Atualize `correction.json`:

- `summary.revisados_revisor`: incrementa em qualquer status_revisor != pendente
- `summary.corrigidos_pelo_revisor`: incrementa quando `corrigido_pelo_revisor`
- `ultima_atualizacao`: timestamp

**`summary.nao_aprovados` NÃO incrementa aqui.** Esse campo é estabilizado na inicialização (Etapa 5.3) com a contagem de achados rejeitados pelo usuário na Etapa 4. Achados reprovados pelo Revisor ficam refletidos em `by_finding[<idx>].status_revisor: "reprovado"` — consumidores (dashboard, doctor) agregam de lá. Misturar as duas semânticas no mesmo contador foi a fonte do bug detectado em revisão cruzada — agora separados.

**Não avance sem persistir.**

---

# Etapa 9 — Atualização final do `correction.json`

Quando todos os achados aprovados foram revisados:

- `fase_atual: "concluida"`
- `status: "concluida"`
- `finished_at`: timestamp
- `ultima_atualizacao`: timestamp
- `summary.pendentes: 0`

Append no ledger:

```json
{"format_version":1,"ts":"<TIMESTAMP_ISO>","event":"correction_phase_changed","from":"revisor","to":"concluida"}
{"format_version":1,"ts":"<TIMESTAMP_ISO>","event":"correction_finalized","status":"concluida"}
```

Commit:

```bash
git add Auditoria/<dominio>/runs/<RUN_ID>/correcao/correction.json Auditoria/<dominio>/runs/<RUN_ID>/phase-ledger.jsonl
git commit -m "chore(auditoria): fase revisor concluída"
```

---

# Etapa 10 — Validação técnica pós-correção

## 10.1 — Type check

```bash
npx tsc --noEmit
```

Se o projeto não usa TypeScript, registre `nao_aplicavel` e siga.

## 10.2 — Build

Identifique o comando:

1. `package.json` → `scripts.build`
2. `Makefile` → target `build`
3. Outro mecanismo visível

Execute. Capture sucesso/falha e mensagem.

## 10.3 — Testes dos arquivos modificados (opcional, recomendado)

Para cada arquivo de código modificado nos commits da Fase Executor + Revisor, encontre o arquivo de teste correspondente:

| Stack  | Convenção                                                              |
|--------|------------------------------------------------------------------------|
| Node   | `*.test.ts` ao lado, ou `__tests__/`                                   |
| Python | `tests/test_*.py`, `pytest <arquivo>`                                  |
| Go     | `*_test.go` no mesmo package, `go test ./<pacote>`                     |
| Rust   | `cargo test --test <nome>`                                             |

Execute apenas testes que cobrem os arquivos modificados — não a suite completa (caro).

Se não houver teste correspondente, registre `cobertura_de_teste: ausente` em `correction-report.json.blocked[]`.

Se um teste relacionado falhar:
- Indica regressão.
- Recue a correção do achado específico (`git revert <commit>`).
- Marque achado como `status_executor: falhou` ou `status_revisor: reprovado` com observação `regressao_em_teste`.
- Revisor pode tentar nova abordagem ou ficar como pendência humana.

## 10.4 — Tratamento de falhas de type check ou build

Limite: **3 tentativas**.

Para cada tentativa:

1. Analise o erro.
2. Implemente correção.
3. Commit:
   ```bash
   git commit -m "fix(auditoria): corrigir erro de <type-check|build> pós-correção
   
   Erro: <mensagem_resumida>"
   ```
4. Re-execute type check / build.
5. Registre tentativa em `correction-report.json.build_attempts[]`.

Após 3 falhas, registre bloqueio em `correction-report.json.blocked[]` com a mensagem persistente e siga para Etapa 11. As correções aplicadas permanecem na branch.

---

# Etapa 11 — Geração do `correction-report.json`

Em `/Auditoria/<dominio>/runs/<RUN_ID>/correcao/correction-report.json`:

```json
{
  "format_version": 1,
  "domain": "<dominio>",
  "run_id": "<RUN_ID>",
  "finalizado_em": "<TIMESTAMP_ISO>",
  "branch": "fix/<dominio>/<RUN_ID>",
  "merged_to": null,
  "summary": {
    "total_aprovados": <N>,
    "corrigidos_executor": <N>,
    "revisados_revisor": <N>,
    "corrigidos_pelo_revisor": <N>,
    "nao_corrigiveis": <N>,
    "nao_aprovados": <N>
  },
  "by_finding": [
    // copiar by_finding[] de correction.json (estado final)
  ],
  "build_attempts": [
    {
      "timestamp": "<TIMESTAMP_ISO>",
      "command": "npx tsc --noEmit",
      "exit_code": 0,
      "summary": null
    },
    {
      "timestamp": "<TIMESTAMP_ISO>",
      "command": "npm run build",
      "exit_code": 0,
      "summary": null
    }
  ],
  "blocked": []
}
```

Se houve bloqueio de build, `blocked[]` contém strings descritivas. Se cobertura de teste foi ausente em arquivos, também entra em `blocked[]` (informativo, não fatal).

Commit:

```bash
git add Auditoria/<dominio>/runs/<RUN_ID>/correcao/correction-report.json
git commit -m "chore(auditoria): relatório final de correção da run <RUN_ID>"
```

---

# Etapa 12 — Regeneração do `report-consolidado.json`

As correções produziram **novo estado** em `correction.json` (`by_finding[<idx>].status_executor`, `status_revisor`, `commit_executor`, `commit_revisor`) sem alterar o `findings.json` da run histórica (que permanece read-only com os achados originais em `aberto`/`confirmado`). Para que dashboards externos consolidem a visão "achado original × estado da correção", regenere:

```bash
RAIZ_PROJETO_ALVO="$(pwd)"
while [ "$RAIZ_PROJETO_ALVO" != "/" ] && [ ! -d "$RAIZ_PROJETO_ALVO/Auditoria" ]; do
  RAIZ_PROJETO_ALVO="$(dirname "$RAIZ_PROJETO_ALVO")"
done

"$RAIZ_PROJETO_ALVO/.audkit" report "$RAIZ_PROJETO_ALVO"
```

## Tratamento de erro

- `.audkit` ausente: pule silenciosamente. Correção em si está concluída.
- `.audkit` falhou: registre como `note` no ledger histórico e siga. Não invalida a finalização.

Após sucesso, commite o report:

```bash
git add Auditoria/_framework/report-consolidado.json Auditoria/_framework/report-consolidado.md
git commit -m "chore(auditoria): regenera relatório consolidado após correção da run <RUN_ID>"
```

---

# Etapa 13 — Auto-PR opcional (via `gh` CLI)

Se `gh` está no PATH **e** `AUDKIT_AUTO_PR=1`, abra um PR antes de pedir merge:

```bash
gh pr create \
  --title "fix(auditoria): correção da run <RUN_ID> (<dominio>)" \
  --body-file /tmp/audkit-pr-body-<RUN_ID>.md \
  --label auditoria,correcao \
  --base main \
  --head fix/<dominio>/<RUN_ID>
```

Corpo do PR (em `/tmp/audkit-pr-body-<RUN_ID>.md`):

```markdown
## Correção — <dominio> · run <RUN_ID>

### Resumo
- Achados corrigidos: <N>
- Corrigidos pelo Revisor: <N>
- Não corrigíveis: <N>

### Validação técnica
- Type check: <STATUS>
- Build: <STATUS>

### Rastreabilidade
- Branch: `fix/<dominio>/<RUN_ID>`
- Run arquivada: `/Auditoria/<dominio>/runs/<RUN_ID>/`
- Estado da correção: `correcao/correction.json`
- Relatório: `correcao/correction-report.json`

🤖 Gerado por audkit (Framework de Auditoria WeaveCode v4).
```

Se `gh` ausente ou `AUDKIT_AUTO_PR` não setado, pule.

**PR aberto ≠ merge automático.** Merge continua sendo decisão humana.

---

# Etapa 14 — Solicitação de merge

```
Correção concluída.

Domínio: <dominio>
Run:     <RUN_ID>
Branch:  fix/<dominio>/<RUN_ID>

Resultado:
- Aprovados:                              <N>
- Corrigidos pelo Executor:               <N>
- Aprovados pelo Revisor sem alteração:   <N>
- Corrigidos pelo Revisor:                <N>
- Não corrigíveis:                        <N>
- Não aprovados:                          <N>
- Reprovados (executor + revisor falhou): <N>

Validação técnica:
- Type check: <RESULTADO>
- Build:      <RESULTADO>

Total de commits: <N>

Deseja fazer merge da branch fix/<dominio>/<RUN_ID> na main?
```

## Se aprovar

```bash
git checkout main
git merge fix/<dominio>/<RUN_ID> --no-ff -m "merge(auditoria): correção completa da run <RUN_ID> do domínio <dominio>"
```

Atualize `correction-report.json`:

- `merged_to: "main"` (ou nome da branch destino)

Commit:

```bash
git add Auditoria/<dominio>/runs/<RUN_ID>/correcao/correction-report.json
git commit -m "chore(auditoria): merge da run <RUN_ID> registrado"
```

```
Merge concluído.

Branch fix/<dominio>/<RUN_ID> → main

Estado: /Auditoria/<dominio>/runs/<RUN_ID>/correcao/correction-report.json
```

## Se recusar

```
Merge não realizado. A branch fix/<dominio>/<RUN_ID> está preservada.

Você pode:
- Revisar manualmente
- Fazer merge depois com: git merge fix/<dominio>/<RUN_ID> --no-ff
- Ou descartar com:        git branch -D fix/<dominio>/<RUN_ID>

Estado: /Auditoria/<dominio>/runs/<RUN_ID>/correcao/correction-report.json
```

---

# Regras gerais de execução

1. Não corrigir achados sem plano aprovado.
2. Não pular achados sem justificativa em `observacoes`.
3. Não marcar achado como corrigido sem correção real no código.
4. Não modificar JSONs originais em `runs/<RUN_ID>/{run,state,findings,report}.json` (read-only). Apenas `correcao/` é writable. **Exceção**: `runs/<RUN_ID>/phase-ledger.jsonl` é **append-only** — eventos de correção são anexados ao final, mas linhas anteriores nunca são modificadas. Por isso ele entra no `git add` da Etapa 5.5 e nos commits subsequentes (fim do Executor, fim do Revisor).
5. Cada achado corrigido = 1 commit com mensagem padronizada.
6. Executor pode paralelizar. Revisor nunca.
7. Revisor usa `git diff`. Não basta olhar o arquivo final.
8. Revisor corrige discrepâncias diretamente. Não devolve.
9. Commits do Revisor: prefixo `review-fix(...)`. Commits do Executor: prefixo `fix(...)`.
10. Persistir `correction.json` após cada achado.
11. Build falha: 3 tentativas, depois bloqueio registrado.
12. Não fazer merge sem autorização.
13. Estado oficial está em `correction.json` + ledger — nunca na memória da conversa.
14. Não rodar lint, testes E2E ou suite completa. Apenas type check + build + testes específicos dos arquivos tocados.

---

# Critério de conclusão desta execução

A execução só pode encerrar com sucesso quando:

1. Todos os achados aprovados foram processados pelo Executor.
2. Todos os achados aprovados foram revisados pelo Revisor.
3. Type check e build foram executados (resultado registrado em `correction-report.json.build_attempts[]`).
4. `correction.json` está com `status: "concluida"` e `fase_atual: "concluida"`.
5. `correction-report.json` está preenchido.
6. Ledger histórico tem todos os eventos de correção (`correction_started`, `correction_phase_changed`, `correction_finding_attempted` por achado, `correction_finding_reviewed` por achado, `correction_finalized`).
7. Usuário foi informado e consultado sobre merge.

Em nenhuma hipótese encerrar com:

- achado aprovado sem processamento do Executor
- achado processado pelo Executor sem revisão do Revisor
- `correction.json` com `status: "em_andamento"`
- `correction-report.json` ausente
- `build_attempts[]` vazio quando type check ou build foram aplicáveis
