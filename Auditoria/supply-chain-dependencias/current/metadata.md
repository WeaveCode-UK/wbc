# Metadata da Run Atual

- dominio: supply-chain-dependencias
- run_id: none
- status: not_started
- iniciado_em: none
- finalizado_em: none
- escopo: none
- origem: bootstrap-core
- versao_framework: 3.3.0
- responsavel_execucao: agente-local
- modo_execucao: incremental-por-fase
- auditoria_anterior_relacionada: none
- observacoes: current inicial criado pelo bootstrap core

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
- `completed` e `archived` são estados históricos e devem existir apenas em runs finalizadas.
- Enquanto a run estiver em `current`, os estados válidos práticos são:
  - not_started
  - in_progress
  - blocked
  - ready_for_finalize

## Atualização Esperada
Atualize este arquivo apenas quando houver mudança real de estado da run.
Não use este arquivo para registrar achados técnicos ou histórico detalhado de execução.
