# Progresso da Correção

## Identificação
- dominio: testes-qualidade
- run_id: 2026-04-19_07-59-20
- branch: fix/testes-qualidade/2026-04-19_07-59-20
- data_inicio: 2026-04-22 01:35:00
- ultima_atualizacao: 2026-04-22 02:05:00
- fase_atual: revisor
- status: em_andamento

## Resumo de Progresso
- total_aprovados: 16
- corrigidos_executor: 16
- revisados_revisor: 1
- corrigidos_pelo_revisor: 0
- nao_corrigiveis: 0
- nao_aprovados: 0
- pendentes: 0

## Nota de contexto
Projeto em Fase 4, CLAUDE.md proíbe testes até Fase 7. Correções seguem o padrão "semear + documentar follow-up" para ACHs que exigiriam escrita de testes novos. Todos os 9 ACHs de portfolio foram agrupados em um commit único (414a006) que entrega `begin/WBC-Fase7-Testes-Roadmap.md` com plano detalhado por bloco.

## Achados

### ACH-001
- titulo: Adapters Prisma sem testes
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado_direto
- commit_executor: 414a006
- descricao_correcao: documentado em roadmap Fase 7, Bloco 1 (Persistência).
- nota_revisor: Bloco 1 cobre setup (jest-mock-extended OU testcontainers-postgres), CRUD feliz, constraint violation (unique/FK), multi-tenant scoping e optimistic lock; alvos iniciais sale/client/product/outbox presentes. Aprovação parcial adequada pelo constraint CLAUDE.md "ZERO testes até Fase 7".

### ACH-002
- titulo: Sem teste de isolamento multi-tenant (evil twin)
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 414a006
- descricao_correcao: roadmap Bloco 2 + helper mockTenantPair já seeded em test-utils/mock-tenant-ctx.ts.

### ACH-003
- titulo: confirmSale sem testes
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 414a006
- descricao_correcao: roadmap Bloco 3.

### ACH-004
- titulo: Sem testes genéricos de resiliência (rate-limit, idempotency, outbox)
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 414a006
- descricao_correcao: roadmap Bloco 4.

### ACH-005
- titulo: Reset-password e forgot-password sem testes
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 414a006
- descricao_correcao: roadmap Bloco 5.

### ACH-006
- titulo: CI sem enforcement de coverage threshold
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: bd876f9
- arquivos_alterados:
  - .github/workflows/ci.yml (pnpm test:coverage + upload)
  - vitest.config.ts (reporter text/html/lcov)

### ACH-007
- titulo: arch:check não é gate de CI
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: bd876f9
- arquivos_alterados:
  - .github/workflows/ci.yml (novo job arch-check)

### ACH-008
- titulo: Mocks manuais repetidos — sem factories
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 507e405
- arquivos_alterados:
  - packages/shared/src/__tests__/factories/README.md (novo)
  - packages/shared/src/__tests__/factories/make-mock-repo.ts (novo)

### ACH-009
- titulo: Sem Redis mock/testcontainers
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 414a006
- descricao_correcao: roadmap Bloco 6.

### ACH-010
- titulo: Sem contract testing
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 414a006
- descricao_correcao: roadmap Bloco 7.

### ACH-011
- titulo: E2E mínimo
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 414a006
- descricao_correcao: roadmap Bloco 8.

### ACH-012
- titulo: 6 módulos business sem testes
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 414a006
- descricao_correcao: roadmap Bloco 9 com ordem de prioridade.

### ACH-013
- titulo: Pre-commit não roda testes
- severidade: baixo
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: df92ae2
- arquivos_alterados:
  - .husky/pre-commit (TODO Fase 7 + comando pronto)

### ACH-014
- titulo: Threshold coverage 20% muito baixo
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: bd876f9
- arquivos_alterados:
  - vitest.config.ts (comentário com escalonamento 20→40→70→80)

### ACH-015
- titulo: Falta test-utils compartilhado
- severidade: baixo
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 507e405
- arquivos_alterados:
  - packages/shared/src/__tests__/test-utils/README.md (novo)
  - packages/shared/src/__tests__/test-utils/mock-tenant-ctx.ts (novo)

### ACH-016
- titulo: CI sem matrix de Node
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: bd876f9
- arquivos_alterados:
  - .github/workflows/ci.yml (strategy.matrix.node-version: [20, 22])
