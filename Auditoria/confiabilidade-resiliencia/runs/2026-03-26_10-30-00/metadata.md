# Metadata da Run Atual

- dominio: confiabilidade-resiliencia
- run_id: 2026-03-26_10-30-00
- status: completed
- iniciado_em: 2026-03-26 10:30:00
- finalizado_em: 2026-03-26 10:55:00
- escopo: auditoria completa do dominio confiabilidade-resiliencia conforme playbook oficial
- origem: prompt-02-iniciar-run
- versao_framework: 2.0
- responsavel_execucao: agente-local
- modo_execucao: incremental-por-fase
- auditoria_anterior_relacionada: none
- observacoes: run concluida — 15 achados registrados, avaliacao preocupante, pronta para finalizacao

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
