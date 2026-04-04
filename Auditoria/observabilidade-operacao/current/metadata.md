# Metadata da Run Atual

- dominio: observabilidade-operacao
- run_id: none
- status: not_started
- iniciado_em: none
- finalizado_em: none
- escopo: none
- origem: reinicializado pelo Prompt 04 apos finalizacao de 2026-03-26_11-00-00
- versao_framework: 2.0
- responsavel_execucao: agente-local
- modo_execucao: incremental-por-fase
- auditoria_anterior_relacionada: 2026-03-26_11-00-00
- observacoes: current reinicializado em 2026-03-26 11:25:00

## Estados Permitidos
- not_started
- in_progress
- blocked
- ready_for_finalize
- completed
- archived

## Regras
- Nao alterar o dominio.
- Nao inventar novos status.
- Nao marcar `completed` nesta area de `current`.
- Em `current`, os estados validos sao: not_started, in_progress, blocked, ready_for_finalize.

## Atualizacao Esperada
Atualize este arquivo apenas quando houver mudanca real de estado da run.
