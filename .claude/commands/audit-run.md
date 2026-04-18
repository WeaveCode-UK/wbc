---
description: Inicia e executa uma run de auditoria para um domínio específico (atalho para Prompts 02 + 03). Pula a seleção do BEGIN. Argumento obrigatório - o slug do domínio (ex. seguranca, arquitetura). Se o domínio já tem run ativa, retoma de onde parou.
argument-hint: <dominio>
---

# audit-run — Executar run de auditoria em um domínio

O usuário invocou `/audit-run $ARGUMENTS`. O slug do domínio a auditar é: **$ARGUMENTS**

## O que fazer

1. **Valide o slug `$ARGUMENTS`.** Deve ser um dos 15 domínios oficiais:
   - `arquitetura`, `codigo-manutenibilidade`, `seguranca`, `apis-integracoes`, `dados-persistencia`, `performance-escalabilidade`, `confiabilidade-resiliencia`, `observabilidade-operacao`, `testes-qualidade`, `ui-ux-fluxos`, `infraestrutura-deploy-config`, `compliance-privacidade`, `supply-chain-dependencias`, `custos-finops`, `documentacao-runbooks`.
   - Se `$ARGUMENTS` estiver vazio ou inválido: mostre a lista e peça correção. Encerre.

2. **Verifique se o framework está inicializado** lendo `/Auditoria/_framework/status-geral.md`.
   - Se não existir: sugira `/audit-begin` para inicializar. Encerre.

3. **Leia o metadata do domínio** em `/Auditoria/$ARGUMENTS/current/metadata.md` e o campo `status`.

4. **Rota de execução:**
   - `not_started` → Carregue `/Auditoria/_framework/prompts/prompt-02-*.md` e execute. Quando o Prompt 02 pedir o domínio, **forneça automaticamente** `$ARGUMENTS`. Depois carregue e execute o Prompt 03.
   - `in_progress` ou `blocked` → Carregue `/Auditoria/_framework/prompts/prompt-03-*.md` e execute para retomar.
   - `ready_for_finalize` → Avise o usuário que a run já está pronta para finalizar, sugira Prompt 04 ou o BEGIN.
   - outros valores → informe o conflito e encerre.

5. Ao concluir, pergunte se o usuário quer finalizar (Prompt 04) ou corrigir os achados (Prompt 05 via `/audit-fix`).

## Restrições

- Um prompt por vez na memória; descarte antes de carregar o próximo.
- Só modifique arquivos dentro de `/Auditoria/`.
- Não invente achados sem evidência observável no repositório.
