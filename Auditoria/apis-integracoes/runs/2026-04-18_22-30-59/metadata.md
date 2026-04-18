# Metadata da Run Atual

- dominio: apis-integracoes
- run_id: 2026-04-18_22-30-59
- status: ready_for_finalize
- iniciado_em: 2026-04-18 22:30:59
- finalizado_em: none
- escopo: auditoria completa do domínio apis-integracoes conforme playbook oficial
- origem: prompt-02-iniciar-run
- versao_framework: 3.3.0
- responsavel_execucao: agente-local
- modo_execucao: incremental-por-fase
- auditoria_anterior_relacionada: none
- observacoes: 7 fases concluídas; 20 achados consolidados; avaliacao preocupante

## Estados Permitidos
- not_started
- in_progress
- blocked
- ready_for_finalize
- completed
- archived

## Regras
- Não alterar o domínio.
- Não inventar novos status.
- Não marcar `completed` nesta área de `current`.
- Em `current`, os estados válidos são: not_started, in_progress, blocked, ready_for_finalize.

## Atualização Esperada
Atualize este arquivo apenas quando houver mudança real de estado da run.
