# Metadata da Run Atual

- dominio: testes-qualidade
- run_id: 2026-03-26_11-30-00
- status: completed
- iniciado_em: 2026-03-26 11:30:00
- finalizado_em: 2026-03-26 11:34:00
- escopo: auditoria completa do dominio testes-qualidade
- origem: prompt-auditoria-completa
- versao_framework: 2.0
- responsavel_execucao: agente-local
- modo_execucao: incremental-por-fase
- auditoria_anterior_relacionada: none
- observacoes: run concluida — 9 achados registrados (1 critico, 5 altos, 2 medios, 1 informativo)

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
