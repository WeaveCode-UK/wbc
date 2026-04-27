---
description: Mostra o estado atual do Framework de Auditoria no projeto (domínios, runs ativas, achados pendentes, correções em andamento). Leitura pura, não modifica arquivos. Use para descobrir o que existe antes de agir.
---

# audit-status — Resumo do estado do framework

Você foi invocado para mostrar o estado atual do Framework de Auditoria (v4 JSON-first).

## O que fazer

1. Verifique se `/Auditoria/_framework/audit-index.json` existe.
   - **Se não existir**: informe que o framework não foi inicializado e sugira `/audit-begin`. Encerre.
   - **Se existir `/Auditoria/_framework/status-geral.md` em vez** (formato pré-v4): informe que o projeto está em formato legado e sugira `audkit migrate <projeto>` antes de qualquer operação. Encerre.

2. Leia os seguintes arquivos JSON validados:
   - `/Auditoria/_framework/audit-index.json` — extraia `framework_version`, `updated_at`, `playbooks_seed_status`, `domains[]`.
   - Para cada domínio com `status_current` diferente de `not_started`:
     - `/Auditoria/<dominio>/current/run.json` — confirma `run_id` e `status`.
     - `/Auditoria/<dominio>/current/state.json` — `fase_atual`, contagem de fases concluídas vs totais (em `phases[]`).
     - `/Auditoria/<dominio>/current/findings.json` — `findings.length` (achados em aberto na run ativa).
   - Para cada domínio com `ultima_run_finalizada != null`:
     - `/Auditoria/<dominio>/runs/runs-index.json` — última entrada em `runs[]` (avaliação, severidades).

3. Apresente uma tabela resumida:

   ```
   Domínio                       | Status current       | Run ativa             | Última finalizada     | Achados pendentes
   ------------------------------|----------------------|-----------------------|-----------------------|------------------
   arquitetura                   | not_started          | -                     | -                     | -
   codigo-manutenibilidade       | in_progress          | 2026-04-26_10-15-30   | -                     | 3
   seguranca                     | not_started          | -                     | 2026-04-10_14-30-12   | -
   ...
   ```

4. Se houver runs ativas (`in_progress`, `blocked`, `ready_for_finalize`), destaque o próximo passo recomendado para cada uma:
   - `in_progress` → "continue com `/audit-run <dominio>` ou retome via Prompt 03"
   - `blocked` → "leia `state.json.open_blockers` e resolva ou pule o domínio"
   - `ready_for_finalize` → "finalize com Prompt 04 ou continue o BEGIN"

5. Se houver correções em andamento, percorra `/Auditoria/<dominio>/runs/<run_id>/correcao/correction.json` e mostre as que têm `status: "em_andamento"` separadamente:
   - domínio, run_id, branch, `fase_atual` (executor/revisor), `summary.pendentes`.

## Restrições

- **Somente leitura.** Não modifique nenhum arquivo.
- Não invoque outros prompts; apenas reporte o que leu dos JSONs.
- Se um JSON estiver malformado, reporte o problema sem tentar corrigir (sugira `audkit doctor <projeto>`).
