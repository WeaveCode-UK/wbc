# Progresso da Correção

## Identificação
- dominio: arquitetura
- run_id: 2026-04-18_18-17-50
- branch: fix/arquitetura/2026-04-18_18-17-50
- data_inicio: 2026-04-18 18:48:00
- ultima_atualizacao: 2026-04-18 19:05:00
- fase_atual: executor
- status: em_andamento

## Resumo de Progresso
- total_aprovados: 13
- corrigidos_executor: 3
- revisados_revisor: 0
- corrigidos_pelo_revisor: 0
- nao_corrigiveis: 0
- nao_aprovados: 0
- pendentes: 10

## Achados

### ACH-009
- titulo: Worker sem graceful shutdown — risco de perda de jobs em-flight
- severidade: critico
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: c8d2310d24ce05dbd5a2a765c374c18f26bd98f7
- commit_revisor: none
- arquivos_alterados:
  - apps/worker/src/index.ts
- descricao_correcao: Handler de SIGTERM/SIGINT que cancela os 3 setIntervals, pausa os 5 BullMQ workers com .pause(true) drenando in-flight, fecha workers com .close(), desconecta Redis (bullmqRedis.quit()) e Prisma (prisma.$disconnect()), e executa exit(0). Timeout de segurança de 30s (WORKER_SHUTDOWN_TIMEOUT_MS) com force exit(1). Lock previne shutdown duplicado.
- observacoes: none

### ACH-007
- titulo: Ausência de enforcement automatizado para regras hexagonal
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: pending (sera preenchido apos commit)
- commit_revisor: none
- arquivos_alterados:
  - package.json (adiciona prettier e dependency-cruiser em devDependencies; adiciona script arch:check)
  - pnpm-lock.yaml (atualizado por pnpm add)
  - .prettierignore (novo - exclui Auditoria/ de reformatacao)
  - .dependency-cruiser.cjs (novo - regras hexagonais)
- descricao_correcao: Instalados prettier@3.8.3 (resolve bug do pre-commit hook com ENOENT) e dependency-cruiser@17.3.10 como devDependencies. Criado .dependency-cruiser.cjs com 6 regras arquiteturais: (1-4) hexagonal forbidden imports; (5) no-cross-business-module-imports; (6) no-circular; + no-orphans como warn. Criado .prettierignore excluindo Auditoria/ e .auditoria-backup-*/ para preservar conteudo canonico do framework. Script arch:check adicionado ao package.json root.
- observacoes: arch:check nao foi executado neste commit para respeitar regra 15 do Prompt 05 (nao rodar lint/testes automaticamente). Sera executado manualmente ou no CI.

### ACH-005
- titulo: Lógica de domínio (cálculos de negócio) vazada em adapters Prisma
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: pending
- commit_revisor: none
- arquivos_alterados:
  - packages/business/sales/domain/value-objects.ts (adiciona computeItemSubtotal, computeSaleSubtotal, computeSaleTotal)
  - packages/business/sales/domain/cashback.ts (novo - computeAvailableCashback, daysUntilExpiry, isCashbackExpiringSoon, computeCashbackAllocation)
  - packages/business/analytics/domain/value-objects.ts (novo - computeAvgTicket, computeDaysSince, computeRecencyBonus, computeEngagementScore, classifyABC)
  - packages/business/sales/adapters/prisma-sale-repository.ts (usa funcoes puras)
  - packages/business/sales/adapters/prisma-cashback-repository.ts (usa funcoes puras)
  - packages/business/analytics/adapters/prisma-analytics-repository.ts (usa funcoes puras)
- descricao_correcao: Extracao de regras de negocio de adapters para domain/. Funcoes puras: calculo de subtotal/total de venda (sales), saldo e alocacao de cashback (sales/cashback), ticket medio + engagement score + classificacao ABC (analytics). Adapters agora apenas delegam para domain/ e persistem via Prisma. Invariantes explicitas: total nunca negativo, alocacao de cashback nunca excede available/remaining, recency bonus zero para clientes sem compra.
- observacoes: mantida compatibilidade de comportamento — cada funcao pura reproduz exatamente o calculo que estava inline nos adapters. Nenhum cenario de negocio alterado, apenas deslocamento de responsabilidade para a camada correta.

### ACH-008
- titulo: Políticas de retry, timeout e circuit breaker hardcoded em cada adapter externo
- severidade: medio
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-012
- titulo: Isolamento multi-tenant em Redis depende apenas de convenção de prefixo manual
- severidade: medio
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-011
- titulo: Health checks mínimos; sem readiness distinto de liveness e sem métricas de lag de worker
- severidade: medio
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-006
- titulo: Módulo `ai/` diverge do padrão hexagonal (sem `domain/`)
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: skeleton + ADR; decisão final requer validação humana

### ACH-002
- titulo: Topologia de deploy/runtime de produção não documentada
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: RTO/RPO e failover strategy requerem validação humana

### ACH-001
- titulo: Documentação arquitetural textual mas sem visualização consolidada
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: C4 diagram em Mermaid; validação humana do conteúdo

### ACH-004
- titulo: Fluxos de eventos inter-módulos não mapeados em catálogo central
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: varredura de *.events.ts; humano valida completude

### ACH-010
- titulo: Decisões de resiliência (retry, circuit breaker, DLQ, cleanup) sem ADR
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: ADR-007; depende de ACH-009 e ACH-008 aplicados

### ACH-003
- titulo: Decisão de monorepo Turborepo+pnpm não registrada em ADR
- severidade: baixo
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: ADR-005 retroativo

### ACH-013
- titulo: Estratégia de escalabilidade horizontal de workers sem ADR
- severidade: baixo
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: ADR-008; placeholders de decisão para validação humana
