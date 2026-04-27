---
description: Corrige os achados de uma run de auditoria finalizada. Atalho para o Prompt 05 (Fase Executor + Fase Revisor). Modifica código-fonte do projeto, faz commits por achado e pode solicitar merge. Argumento opcional - slug do domínio; se omitido, mostra runs disponíveis.
argument-hint: [dominio]
---

# audit-fix — Corrigir achados de uma run

O usuário invocou `/audit-fix $ARGUMENTS`. Argumento recebido (pode estar vazio): **$ARGUMENTS**

## O que fazer

1. **Verifique que o framework está em v4** lendo `/Auditoria/_framework/audit-index.json`.
   - Se ausente e existir `status-geral.md` (pré-v4): sugira `audkit migrate <projeto>`. Encerre.
   - Se nenhum dos dois: sugira `/audit-begin`. Encerre.

2. **Localize o Prompt 05** em `/Auditoria/_framework/prompts/prompt-05-*.md`.
   - Se não existir: informe que o framework não está inicializado e sugira `/audit-begin`. Encerre.

3. **Se `$ARGUMENTS` estiver preenchido com um slug de domínio válido**, pré-selecione esse domínio para o Prompt 05 (pule a etapa em que o Prompt 05 pede a seleção da run). Use a `ultima_run_finalizada` desse domínio em `audit-index.domains[].ultima_run_finalizada`. Caso contrário (argumento vazio), deixe o próprio Prompt 05 apresentar a lista de runs finalizadas disponíveis (lendo `audit-index.json` e listando domínios com `ultima_run_finalizada != null`).

4. **Leia e execute o Prompt 05 integralmente**, respeitando suas Fases Executor e Revisor.

5. **Use os sub-agentes**:
   - **`audit-executor`** para a Fase Executor — frontier tier, lê `findings.json` da run histórica, escreve `correction.json` (estado vivo) e commits no código.
   - **`audit-reviewer`** para a Fase Revisor — frontier tier, sequencial, achado-por-achado, conforme os guardrails críticos do Prompt 05.

## Guardrails críticos (vêm do Prompt 05)

- **Plano de correção deve ser aprovado pelo usuário antes da execução.**
- **Fase Executor** pode paralelizar correções independentes; cada achado gera commit individual com prefixo `fix(auditoria):`. Atualiza `correction.by_finding[<idx>].{status_executor, commit_executor}`.
- **Fase Revisor** é sequencial, achado-por-achado, em frontier tier. Nunca agrupar. Nunca pular. Se discrepância, corrige diretamente com prefixo `review-fix(auditoria):` e marca `status_revisor: "corrigido_pelo_revisor"`.
- **Merge para main só com autorização explícita do usuário.**
- Não rodar testes automatizados (lint, unit, E2E) automaticamente — só type check, build, e testes específicos dos arquivos tocados (Etapa 10 do Prompt 05).
- **Não modificar JSONs da run arquivada** (`runs/<run_id>/{run,state,findings,report}.json` + `phase-ledger.jsonl`). Esses são read-only — apenas `correcao/correction.json` e `correcao/correction-report.json` são writable.
- Eventos de correção (`correction_started`, `correction_phase_changed`, `correction_finding_attempted`, `correction_finding_reviewed`, `correction_finalized`) são **anexados** ao `phase-ledger.jsonl` da run histórica (append-only).
