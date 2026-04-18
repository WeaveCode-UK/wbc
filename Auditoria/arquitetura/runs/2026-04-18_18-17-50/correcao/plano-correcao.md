# Plano de Correção

## Identificação
- dominio: arquitetura
- run_id: 2026-04-18_18-17-50
- data_geracao: 2026-04-18 18:48:00
- total_achados: 13
- corrigiveis: 7
- corrigiveis_parciais: 6
- nao_corrigiveis: 0
- nao_aprovados: 0

## Decisão sobre pre-commit
Aprovada alternativa (b): instalar `prettier` como devDependency junto com o commit do ACH-007 (lint arquitetural). Os 2 primeiros commits (estrutura inicial + ACH-009) usarão `--no-verify` enquanto `prettier` ainda não existe. A partir do ACH-007 (#3), o hook passa a rodar normalmente em todos os commits.

## Ordem de Execução

### 1. ACH-009 — Worker sem graceful shutdown
- severidade: critico
- classificacao: corrigivel
- arquivo_ou_area_afetada: apps/worker/src/index.ts
- acao_planejada: implementar handler de SIGTERM/SIGINT que (a) pausa os BullMQ workers com `.pause()`, (b) cancela os `setInterval` de outbox/cleanup/DLQ, (c) aguarda jobs em-flight terminarem com timeout configurável, (d) chama `.close()` nos workers e `.disconnect()` em Redis/Prisma, (e) executa `process.exit(0)`
- dependencias: nenhuma
- justificativa_ordem: único crítico; isolado no worker; sem dependências; desbloqueia uso seguro
- risco_da_correcao: baixo — mudança aditiva no boot do worker; não altera lógica de jobs

### 2. ACH-007 — Ausência de enforcement automatizado para regras hexagonal
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: package.json, .eslintrc*, .husky/pre-commit, dependency-cruiser.cjs (novo)
- acao_planejada: adicionar `dependency-cruiser` (mais robusto que eslint-plugin-boundaries para monorepo Turborepo) com regras hexagonais: (a) domain/ não importa de adapters/ nem use-cases/, (b) use-cases/ não importam de adapters/ diretamente, (c) packages/business/X não importa de packages/business/Y. Adicionar script `npm run arch:check` e rodar no CI + pre-commit. Adicionar `prettier` como devDependency para corrigir o bug do pre-commit hook atual.
- dependencias: nenhuma
- justificativa_ordem: enforcement ativo antes da refatoração grande do ACH-005 garante que a correção não introduz nova violação. Também resolve o problema do pre-commit hook (prettier ausente) para os demais commits
- risco_da_correcao: baixo — ferramenta adicional; pode revelar violações adicionais não cobertas pela auditoria (documentar e tratar caso apareça)

### 3. ACH-005 — Cálculos de negócio vazados em adapters Prisma
- severidade: alto
- classificacao: corrigivel
- arquivo_ou_area_afetada: packages/business/sales/, packages/business/analytics/, packages/business/sales/cashback/
- acao_planejada: extrair cálculos (subtotal, total, desconto, cashback em sales; classificação ABC e engagement score em analytics; tetos/pisos em cashback) de adapters Prisma para domain/value-objects.ts. Adapters passam a apenas mapear Prisma ↔ entidades de domínio.
- dependencias: ACH-007 (lint arquitetural ativo para validar a refatoração)
- justificativa_ordem: refator material em regras financeiras; protegido pelo lint do #2
- risco_da_correcao: medio — refactor de código de negócio sensível; projeto inativo (não rodando) reduz o risco operacional; type check + build vão validar ao final

### 4. ACH-008 — Políticas de retry/timeout/circuit breaker hardcoded por adapter
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: packages/shared/resilience/ (novo), packages/business/messaging/adapters/whatsapp-n2-adapter.ts, packages/business/ai/adapters/deepseek-adapter.ts
- acao_planejada: criar `packages/shared/resilience/` com `RetryPolicy`, `TimeoutPolicy`, `CircuitBreakerPolicy`. Refatorar whatsapp-n2-adapter e deepseek-adapter para receber policy via constructor
- dependencias: nenhuma
- justificativa_ordem: independente; antes do ACH-010 (ADR referencia esta estrutura)
- risco_da_correcao: baixo — refactor localizado em 2 adapters; mantém comportamento funcional

### 5. ACH-012 — Isolamento multi-tenant em Redis depende de prefixo manual
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: packages/shared/redis/ (novo), apps/api/src/lib/cache.ts, apps/api/src/lib/queues.ts, apps/worker/
- acao_planejada: criar `TenantScopedRedis` wrapper em `packages/shared/` que prefixa chaves via AsyncLocalStorage e recusa operações sem contexto de tenant. Refatorar cache.ts, queues.ts e usos no worker
- dependencias: nenhuma
- justificativa_ordem: isolado; reutiliza AsyncLocalStorage já presente
- risco_da_correcao: medio — refactor de acesso a Redis cross-app; type check vai capturar erros

### 6. ACH-011 — Health checks mínimos, sem readiness/liveness distintos
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: apps/api/src/routers/health.ts, apps/worker/src/health.ts (novo), docker-compose.prod.yml
- acao_planejada: separar /health/live (processo vivo) e /health/ready (DB + Redis + outbox lag < threshold). Criar endpoint HTTP mínimo no worker com queue depths e outbox lag. Adicionar healthcheck para web/worker em docker-compose.prod.yml
- dependencias: nenhuma
- justificativa_ordem: isolado em endpoints novos
- risco_da_correcao: baixo — adição de endpoints; não remove nem altera existentes

### 7. ACH-006 — Módulo `ai/` diverge do padrão hexagonal
- severidade: medio
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: packages/business/ai/domain/ (novo), docs/adr/006-ai-module-model.md (novo)
- acao_planejada: criar skeleton de `domain/` em ai/ com entidades (`AILimit`, `AIModel`, `AIUsage`). Criar ADR-006 deliberando se ai/ permanece anêmico ou evolui. Placeholders para decisão humana.
- dependencias: nenhuma
- justificativa_ordem: ADR + skeleton; decisão híbrida que precisa de input humano
- risco_da_correcao: baixo — adição de skeleton; não altera código existente de ai/

### 8. ACH-002 — Topologia de deploy/runtime de produção não documentada
- severidade: alto
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: docs/DEPLOYMENT.md (novo)
- acao_planejada: criar docs/DEPLOYMENT.md consolidando topologia de produção baseada em deploy/ e docker-compose.prod.yml. Placeholders para RTO/RPO targets, failover strategy (validação humana)
- dependencias: nenhuma
- justificativa_ordem: doc grande; criada após código refletir correções do #1 (graceful shutdown)
- risco_da_correcao: nenhum — só adiciona documentação

### 9. ACH-001 — Documentação arquitetural sem visualização consolidada
- severidade: medio
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: docs/ARCHITECTURE.md (novo)
- acao_planejada: criar docs/ARCHITECTURE.md com diagrama C4 L1/L2 em Mermaid + matriz de dados resumida + overview executivo linkando ADRs e playbooks
- dependencias: nenhuma
- justificativa_ordem: doc consolidada após ADRs novos dos passos anteriores
- risco_da_correcao: nenhum — só adiciona documentação

### 10. ACH-004 — Fluxos de eventos inter-módulos não mapeados em catálogo
- severidade: medio
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: docs/architecture/events.md (novo)
- acao_planejada: criar docs/architecture/events.md com tabela canônica (nome do evento | publisher | consumers | fila BullMQ | payload schema). Varredura dos *.events.ts e subscribers existentes
- dependencias: nenhuma
- justificativa_ordem: doc baseada em código atual; não bloqueia outras correções
- risco_da_correcao: nenhum — só adiciona documentação

### 11. ACH-010 — Decisões de resiliência sem ADR
- severidade: medio
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: docs/adr/007-resilience-strategies.md (novo)
- acao_planejada: criar ADR-007 documentando circuit breaker, DLQ, cleanup, graceful shutdown (conforme aplicado em #1 e #4)
- dependencias: ACH-009, ACH-008 aplicados
- justificativa_ordem: ADR depende das implementações #1 e #4 para documentar fielmente
- risco_da_correcao: nenhum — só adiciona documentação

### 12. ACH-003 — Decisão de monorepo Turborepo+pnpm sem ADR
- severidade: baixo
- classificacao: corrigivel
- arquivo_ou_area_afetada: docs/adr/005-monorepo-turborepo-pnpm.md (novo)
- acao_planejada: criar ADR-005 retroativo baseado em turbo.json, pnpm-workspace.yaml e estrutura atual. Trade-offs: vs polirepo, vs multirepo
- dependencias: nenhuma
- justificativa_ordem: ADR retroativo; ordem natural no final
- risco_da_correcao: nenhum — só adiciona documentação

### 13. ACH-013 — Estratégia de escalabilidade horizontal sem ADR
- severidade: baixo
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: docs/adr/008-worker-scaling.md (novo)
- acao_planejada: criar ADR-008 com placeholders de decisão (1 pool global vs workers especializados, job affinity, particionamento de queue, pool Prisma por worker)
- dependencias: nenhuma
- justificativa_ordem: ADR roadmap; final
- risco_da_correcao: nenhum — só adiciona documentação

## Achados Não Corrigíveis
Nenhum.

## Achados Não Aprovados pelo Usuário
Nenhum.

## Resumo do Plano
- Total a corrigir: 13
- Total parcial (requer validação humana após correção): 6
- Total não corrigível (ação humana necessária): 0
- Estimativa de commits: ~15-17 (1 inicial de estrutura, 1 por achado = 13, 1 relatório, 1 report-consolidado; mais 0-3 fix de build se necessário)
- Commits com `--no-verify`: 2 primeiros (estrutura inicial + ACH-009), antes de prettier ser instalado
