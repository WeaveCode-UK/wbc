# Índice de Runs do Domínio

## Identificação
- dominio: arquitetura
- ultima_atualizacao: 2026-04-18 18:38:35
- total_runs_registradas: 1

## Regras
- Registrar apenas runs finalizadas.
- Ordenar da mais recente para a mais antiga.
- Cada run deve aparecer uma única vez.
- Cada entrada deve resumir status, escopo, resultado e severidade agregada.

## Runs Registradas

### 2026-04-18_18-17-50
- status: completed
- iniciado_em: 2026-04-18 18:17:50
- finalizado_em: 2026-04-18 18:38:35
- escopo: auditoria completa do domínio arquitetura conforme playbook oficial (5 fases)
- avaliacao: aceitavel_com_ressalvas
- total_achados: 13
- severidades:
  - critico: 1
  - alto: 2
  - medio: 8
  - baixo: 2
  - informativo: 0
- principais_achados:
  - ACH-009 (critico) — worker sem graceful shutdown
  - ACH-002 (alto) — topologia de deploy/runtime de produção não documentada
  - ACH-005 (alto) — cálculos de negócio vazados em adapters Prisma
- arquivos:
  - metadata: runs/2026-04-18_18-17-50/metadata.md
  - acompanhamento: runs/2026-04-18_18-17-50/acompanhamento.md
  - achados: runs/2026-04-18_18-17-50/achados.md
  - relatorio-final: runs/2026-04-18_18-17-50/relatorio-final.md
