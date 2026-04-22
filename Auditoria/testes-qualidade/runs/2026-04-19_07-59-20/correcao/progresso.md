# Progresso da Correção

## Identificação
- dominio: testes-qualidade
- run_id: 2026-04-19_07-59-20
- branch: fix/testes-qualidade/2026-04-19_07-59-20
- data_inicio: 2026-04-22 01:35:00
- ultima_atualizacao: 2026-04-22 01:35:00
- fase_atual: executor
- status: em_andamento

## Resumo de Progresso
- total_aprovados: 16
- corrigidos_executor: 0
- revisados_revisor: 0
- corrigidos_pelo_revisor: 0
- nao_corrigiveis: 0
- nao_aprovados: 0
- pendentes: 16

## Nota de contexto
Projeto em Fase 4, CLAUDE.md proíbe testes até Fase 7. Correções seguem o padrão "semear + documentar follow-up" para ACHs que exigiriam escrita de testes novos.

## Achados

### ACH-001
- titulo: Adapters Prisma sem testes
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none

### ACH-002
- titulo: Sem teste de isolamento multi-tenant (evil twin)
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none

### ACH-003
- titulo: confirmSale e baixa de estoque sem testes
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none

### ACH-004
- titulo: Sem testes genéricos de rate-limit, idempotência e outbox
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none

### ACH-005
- titulo: Reset-password e forgot-password sem testes
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none

### ACH-006
- titulo: CI sem enforcement de coverage threshold
- severidade: medio
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none

### ACH-007
- titulo: arch:check não é gate de CI
- severidade: medio
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none

### ACH-008
- titulo: Mocks manuais repetidos — sem factories
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none

### ACH-009
- titulo: Sem Redis mock/testcontainers
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none

### ACH-010
- titulo: Sem contract testing
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none

### ACH-011
- titulo: E2E mínimo
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none

### ACH-012
- titulo: 6 módulos business sem testes
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none

### ACH-013
- titulo: Pre-commit não roda testes
- severidade: baixo
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none

### ACH-014
- titulo: Threshold coverage 20% muito baixo
- severidade: baixo
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none

### ACH-015
- titulo: Falta test-utils compartilhado
- severidade: baixo
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none

### ACH-016
- titulo: CI sem matrix de Node
- severidade: baixo
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
