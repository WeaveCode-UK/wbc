# Progresso da Correção

## Identificação
- dominio: testes-qualidade
- run_id: 2026-04-19_07-59-20
- branch: fix/testes-qualidade/2026-04-19_07-59-20
- data_inicio: 2026-04-22 01:35:00
- ultima_atualizacao: 2026-04-22 03:00:00
- fase_atual: revisor
- status: em_andamento

## Resumo de Progresso
- total_aprovados: 16
- corrigidos_executor: 16
- revisados_revisor: 10
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
- status_revisor: aprovado_direto
- commit_executor: 414a006
- descricao_correcao: roadmap Bloco 2 + helper mockTenantPair já seeded em test-utils/mock-tenant-ctx.ts.
- nota_revisor: Bloco 2 do roadmap referencia mockTenantPair() e o padrão evil twin por use-case tenant-scoped, com cross-ref para RLS Postgres (dados-persistencia ACH-004). Helper em 507e405 exporta mockTenantPair() retornando alice (tenant-a/CONSULTANT) e bob (tenant-b/CONSULTANT) via mockTenantCtx, pronto para consumo em Fase 7. Aprovação parcial adequada pelo constraint CLAUDE.md "ZERO testes até Fase 7".

### ACH-003
- titulo: confirmSale sem testes
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado_direto
- commit_executor: 414a006
- descricao_correcao: roadmap Bloco 3.
- nota_revisor: Bloco 3 do roadmap cobre os 4 cenários exigidos — caminho feliz (stock decrement + outbox publish + cashback apply), falha de estoque (rollback transação, evento não publicado), race condition Serializable sob concorrência, retry idempotente (cross-ref ACH-001 confiabilidade-resiliencia / processed_events). Aprovação parcial adequada pelo constraint CLAUDE.md "ZERO testes até Fase 7".

### ACH-004
- titulo: Sem testes genéricos de resiliência (rate-limit, idempotency, outbox)
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado_direto
- commit_executor: 414a006
- descricao_correcao: roadmap Bloco 4.
- nota_revisor: Bloco 4 do roadmap cobre os 4 mecanismos exigidos pelo ACH-004 — rate-limit middleware (bucket por rota + identificador), idempotent(key, fn) wrapper com cenário de cache + TTL, outbox publisher (traceparent metadata, cross-ref ACH-011 observabilidade) e subscriber (falhas propagadas + withIdempotentHandler, cross-ref ACH-002 confiabilidade), claimPending atômico com teste de concorrência dois workers em FOR UPDATE SKIP LOCKED. Aprovação parcial adequada pelo constraint CLAUDE.md "ZERO testes até Fase 7".

### ACH-005
- titulo: Reset-password e forgot-password sem testes
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado_direto
- commit_executor: 414a006
- descricao_correcao: roadmap Bloco 5.
- nota_revisor: Bloco 5 do roadmap cobre os três requisitos do ACH-005 — (a) request reset gerando token único com persist de hash e envio de email, (b) consumo com três cenários (válido muda password, usado rejeitado, expirado rejeitado), (c) rate-limit específico testado via SENSITIVE_ROUTE_LIMITS (X tentativas em janela → 429). Cross-ref seguranca/ACH-001 reconhecido ("quando saírem de stub"). Aprovação parcial adequada pelo constraint CLAUDE.md "ZERO testes até Fase 7".

### ACH-006
- titulo: CI sem enforcement de coverage threshold
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado_direto
- commit_executor: bd876f9
- arquivos_alterados:
  - .github/workflows/ci.yml (pnpm test:coverage + upload)
  - vitest.config.ts (reporter text/html/lcov)
- nota_revisor: CI job test agora executa `pnpm test:coverage` (script já existente em package.json → `vitest run --coverage`), com upload-artifact v4 de `coverage/` (retention 14 dias, só no node 20 para evitar duplicação na matrix). vitest.config.ts declara `reporter: ["text","html","lcov"]` e thresholds lines/branches/functions/statements=20 — v8 provider falha o job via exit code ≠0 se coverage cair abaixo, satisfazendo o "falhar PR abaixo do threshold". Escalonamento (20→40→70→80) documentado no comment ACH-014. Recomendação atendida integralmente.

### ACH-007
- titulo: arch:check não é gate de CI
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado_direto
- commit_executor: bd876f9
- arquivos_alterados:
  - .github/workflows/ci.yml (novo job arch-check)
- nota_revisor: Job `arch-check` dedicado (ci.yml linhas 60-72) com step `pnpm arch:check` — script resolve para `depcruise --config .dependency-cruiser.cjs apps packages`, cujo exit ≠0 falha o job em qualquer violação das regras hexagonais. Job roda em paralelo a `test`/`lint-and-typecheck` (sem `needs:`) no mesmo trigger push/pull_request para main, então PR é bloqueado se dep-cruiser detectar violação. Recomendação atendida integralmente.

### ACH-008
- titulo: Mocks manuais repetidos — sem factories
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado_direto
- commit_executor: 507e405
- arquivos_alterados:
  - packages/shared/src/__tests__/factories/README.md (novo)
  - packages/shared/src/__tests__/factories/make-mock-repo.ts (novo)
- nota_revisor: factories/README.md documenta a convenção `<entity>-factory.ts` com `buildX(overrides?)` retornando entidade válida, defaults aleatórios via Faker, determinismo por seed fixo e `setSeed()`, além de plano de migração em Fase 7. factories/make-mock-repo.ts exporta `makeMockRepo<T extends object>(overrides)` via Proxy que resolve overrides e lança erro informativo em métodos não configurados (stub intencional para ser trocado por `vi.fn()` em Fase 7). Faker ainda não é dependência — confirmado via grep em packages/shared/package.json e package.json raiz, comportamento parcial esperado pelo constraint CLAUDE.md "ZERO testes até Fase 7" (Faker será adicionado quando os testes forem escritos). Recomendação seed atendida.

### ACH-009
- titulo: Sem Redis mock/testcontainers
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado_direto
- commit_executor: 414a006
- descricao_correcao: roadmap Bloco 6.
- nota_revisor: Bloco 6 do roadmap (linhas 83-90 de begin/WBC-Fase7-Testes-Roadmap.md) cobre exatamente a recomendação ACH-009 — `ioredis-mock` para testes unitários e testcontainers-redis para integração com os três consumidores Redis do portfólio (rate-limit middleware, idempotency cache, DLQ). Aprovação parcial adequada pelo constraint CLAUDE.md "ZERO testes até Fase 7" — dependências serão adicionadas quando testes forem escritos em Fase 7.

### ACH-010
- titulo: Sem contract testing
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado_direto
- commit_executor: 414a006
- descricao_correcao: roadmap Bloco 7.
- nota_revisor: Bloco 7 do roadmap (linhas 94-98 de begin/WBC-Fase7-Testes-Roadmap.md) cobre as três ações da recomendação ACH-010 — (a) gerar JSON Schema a partir dos schemas Zod do tRPC, (b) snapshot em CI para detectar breaking change silenciosa entre api e mobile, (c) Pact para integrações externas (marcado como futuro). Aprovação parcial adequada pelo constraint CLAUDE.md "ZERO testes até Fase 7" — ferramentas (zod-to-json-schema, @pact-foundation) serão adicionadas quando contract tests forem escritos em Fase 7.

### ACH-011
- titulo: E2E mínimo
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado_direto
- commit_executor: 414a006
- descricao_correcao: roadmap Bloco 8.
- nota_revisor: Bloco 8 do roadmap (linhas 102-109 de begin/WBC-Fase7-Testes-Roadmap.md) expande o E2E playwright além de health/login com os três cenários exigidos pelo ACH-011 — (a) fluxo completo login → criar cliente → criar venda → confirmar → verificar cashback creditado, (b) isolamento multi-tenant alice/bob não vendo clientes um do outro (cross-ref ACH-002), (c) WhatsApp webhook ingest → evento criado → handler processado (cross-ref apis-integracoes). Aprovação parcial adequada pelo constraint CLAUDE.md "ZERO testes até Fase 7".

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
