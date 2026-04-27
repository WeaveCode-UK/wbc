---
description: Inicia e executa uma run de auditoria para um domínio específico (atalho para Prompts 02 + 03). Pula a seleção do BEGIN. Argumento obrigatório - o slug do domínio (ex. seguranca, arquitetura). Se o domínio já tem run ativa, retoma de onde parou.
argument-hint: <dominio>
---

# audit-run — Executar run de auditoria em um domínio

O usuário invocou `/audit-run $ARGUMENTS`. O slug do domínio a auditar é: **$ARGUMENTS**

## O que fazer

1. **Valide o slug `$ARGUMENTS`.** Deve ser um dos 16 domínios oficiais:
   - `arquitetura`, `codigo-manutenibilidade`, `seguranca`, `apis-integracoes`, `dados-persistencia`, `performance-escalabilidade`, `confiabilidade-resiliencia`, `observabilidade-operacao`, `testes-qualidade`, `ui-ux-fluxos`, `infraestrutura-deploy-config`, `compliance-privacidade`, `supply-chain-dependencias`, `custos-finops`, `documentacao-runbooks`, `ai-ml-governanca`.
   - Se `$ARGUMENTS` estiver vazio ou inválido: mostre a lista e peça correção. Encerre.

2. **Verifique se o framework está inicializado em v4** lendo `/Auditoria/_framework/audit-index.json`.
   - Se não existir: sugira `/audit-begin` para inicializar. Encerre.
   - Se existir `/Auditoria/_framework/status-geral.md` em vez (formato pré-v4): sugira `audkit migrate <projeto>` antes. Encerre.

3. **Leia o estado da run atual do domínio** em `/Auditoria/<$ARGUMENTS>/current/run.json` (campo `status`):

4. **Rota de execução:**
   - `not_started` → Carregue `/Auditoria/_framework/prompts/prompt-02-*.md` e execute. Quando o Prompt 02 pedir o domínio, **forneça automaticamente** `$ARGUMENTS`. Depois carregue e execute o Prompt 03.
   - `in_progress` ou `blocked` → Carregue `/Auditoria/_framework/prompts/prompt-03-*.md` e execute para retomar.
   - `ready_for_finalize` → Avise o usuário que a run já está pronta para finalizar, sugira Prompt 04 ou o BEGIN.
   - outros valores → informe o conflito e encerre.

5. Para a fase de análise técnica do Prompt 03, **delegue ao sub-agente `audit-phase-analyzer`** (frontier tier obrigatório) — ele garante que a análise roda no modelo de maior capacidade da plataforma e segue a estrutura JSON-first (escrita em `findings.json`, `state.json` e `phase-ledger.jsonl`).

6. Ao concluir, pergunte se o usuário quer finalizar (Prompt 04) ou corrigir os achados (Prompt 05 via `/audit-fix`).

## Restrições

- Um prompt por vez na memória; descarte antes de carregar o próximo.
- Só modifique arquivos dentro de `/Auditoria/`.
- Não invente achados sem evidência observável no repositório (`evidence.file_path` + linhas, `evidence.command_used` ou `evidence.area`).
- Estado oficial vive nos JSONs validados — `run.json`, `state.json`, `findings.json`, `report.json`, `phase-ledger.jsonl`. Nunca confiar na memória da conversa.
