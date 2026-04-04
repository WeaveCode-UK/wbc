# Metadata da Run Atual

- dominio: seguranca
- run_id: 2026-03-26_01-10-00
- status: completed
- iniciado_em: 2026-03-26 01:10:00
- finalizado_em: 2026-03-26 01:40:00
- escopo: auditoria completa do domínio seguranca conforme playbook oficial
- origem: prompt-02-iniciar-run
- versao_framework: 2.0
- responsavel_execucao: agente-local
- modo_execucao: incremental-por-fase
- auditoria_anterior_relacionada: none
- observacoes: run concluida — 7 fases executadas, 14 achados (3 criticos, 4 altos), avaliacao preocupante

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
