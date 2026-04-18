---
description: Mostra o estado atual do Framework de Auditoria no projeto (domínios, runs ativas, achados pendentes, correções em andamento). Leitura pura, não modifica arquivos. Use para descobrir o que existe antes de agir.
---

# audit-status — Resumo do estado do framework

Você foi invocado para mostrar o estado atual do Framework de Auditoria.

## O que fazer

1. Verifique se `/Auditoria/_framework/status-geral.md` existe.
   - **Se não existir**: informe que o framework não foi inicializado e sugira `/audit-begin`. Encerre.

2. Leia os seguintes arquivos:
   - `/Auditoria/_framework/status-geral.md`
   - Para cada domínio com `ultima_run_finalizada != none`: `/Auditoria/<dominio>/runs-index.md` e o `relatorio-final.md` da run mais recente.
   - Para cada domínio com `status_current` diferente de `not_started`: `/Auditoria/<dominio>/current/metadata.md` e `acompanhamento.md`.

3. Apresente uma tabela resumida:

   ```
   Domínio                       | Status current       | Última run finalizada | Achados abertos
   ------------------------------|----------------------|-----------------------|----------------
   arquitetura                   | not_started          | none                  | -
   codigo-manutenibilidade       | in_progress          | none                  | 3
   seguranca                     | not_started          | 2026-04-10_14-30-12   | 12
   ...
   ```

4. Se houver runs ativas (`in_progress`, `blocked`, `ready_for_finalize`), destaque o próximo passo recomendado para cada uma:
   - `in_progress` → "continue com `/audit-run` ou retome via Prompt 03"
   - `blocked` → "resolva bloqueio ou pule o domínio"
   - `ready_for_finalize` → "finalize com Prompt 04 ou continue o BEGIN"

5. Se houver correções em andamento (pasta `correcao/` com `status: em_andamento`), mostre separadamente.

## Restrições

- **Somente leitura.** Não modifique nenhum arquivo.
- Não invoque outros prompts; apenas reporte o que leu.
- Se um arquivo estiver malformado, reporte o problema sem tentar corrigir.
