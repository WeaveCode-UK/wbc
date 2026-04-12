# Metadata da Run Atual

- dominio: seguranca
- run_id: none
- status: not_started
- iniciado_em: none
- finalizado_em: none
- escopo: none
- origem: reinicializado pelo Prompt 04 apos finalizacao de 2026-04-10_14-39-37
- versao_framework: 2.0
- responsavel_execucao: agente-local
- modo_execucao: incremental-por-fase
- auditoria_anterior_relacionada: 2026-04-10_14-39-37
- observacoes: current reinicializado em 2026-04-12 08:27:12 apos arquivamento da run 2026-04-10_14-39-37

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
