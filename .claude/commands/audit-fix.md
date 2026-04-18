---
description: Corrige os achados de uma run de auditoria finalizada. Atalho para o Prompt 05 (Fase Executor + Fase Revisor). Modifica código-fonte do projeto, faz commits por achado e pode solicitar merge. Argumento opcional - slug do domínio; se omitido, mostra runs disponíveis.
argument-hint: [dominio]
---

# audit-fix — Corrigir achados de uma run

O usuário invocou `/audit-fix $ARGUMENTS`. Argumento recebido (pode estar vazio): **$ARGUMENTS**

## O que fazer

1. **Localize o Prompt 05** em `/Auditoria/_framework/prompts/prompt-05-*.md`.
   - Se não existir: informe que o framework não está inicializado e sugira `/audit-begin`. Encerre.

2. **Se `$ARGUMENTS` estiver preenchido com um slug de domínio válido**, pré-selecione esse domínio para o Prompt 05 (pule a etapa em que o Prompt 05 pede a seleção da run). Caso contrário (argumento vazio), deixe o próprio Prompt 05 apresentar a lista de runs finalizadas disponíveis.

3. **Leia e execute o Prompt 05 integralmente**, respeitando suas Fases Executor e Revisor.

4. **Use o sub-agente `audit-reviewer`** para a Fase Revisor — ele garante que a revisão roda em modelo Opus, sequencialmente, achado-por-achado, conforme os guardrails críticos do Prompt 05.

## Guardrails críticos (vêm do Prompt 05)

- **Plano de correção deve ser aprovado pelo usuário antes da execução.**
- **Fase Executor** pode paralelizar correções independentes; cada achado gera commit individual.
- **Fase Revisor** é sequencial, achado-por-achado, em Opus. Nunca agrupar. Nunca pular.
- **Merge para main só com autorização explícita do usuário.**
- Não rodar testes automatizados (lint, unit, E2E) automaticamente — só type check e build.
- Não modificar arquivos da run arquivada (`metadata.md`, `relatorio-final.md`, etc. dentro de `runs/<run_id>/`).
