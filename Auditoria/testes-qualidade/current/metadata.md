# Metadata da Run Atual

- dominio: testes-qualidade
- run_id: 2026-04-05_18-00-00
- status: in_progress
- iniciado_em: 2026-04-05 18:00:00
- finalizado_em: none
- escopo: auditoria completa do dominio testes-qualidade conforme playbook oficial (segunda passada pos-correcoes)
- origem: prompt-02-iniciar-run
- versao_framework: 2.0
- responsavel_execucao: agente-local
- modo_execucao: incremental-por-fase
- auditoria_anterior_relacionada: run anterior do mesmo dominio
- observacoes: segunda passada da auditoria apos correcoes implementadas

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
- Nao marcar completed nesta area de current.
- Em current, os estados validos sao: not_started, in_progress, blocked, ready_for_finalize.
