# Achados da Auditoria

## Identificação
- dominio: testes-qualidade
- run_id: 2026-04-19_07-59-20
- ultima_atualizacao: 2026-04-19 08:25:00

## Severidades / Status
- critico · alto · medio · baixo · informativo
- aberto · confirmado · mitigado · resolvido · aceito · nao_aplicavel

## Contexto
CLAUDE.md declara "ZERO testes até Fase 7"; projeto está na Fase 4, 18 testes reais (17 unitários + 1 e2e). Severidades abaixo consideram risco residual mesmo dentro da política.

## Achados Registrados

### ACH-001
- titulo: Adapters Prisma sem testes — camada crítica de persistência descoberta
- severidade: alto
- categoria: portfolio
- status: confirmado
- resumo: Repositórios Prisma não têm testes; sem mock de Prisma Client ou testcontainers, isolamento multi-tenant e CRUD ficam sem rede de segurança.

#### Evidencia
- arquivo_ou_area: packages/business/*/adapters/prisma-*-repository.ts (sem `__tests__`)

#### Impacto
- tecnico: Regressão silenciosa em queries/constraints/tenantId
- negocio: Risco alto em isolamento multi-tenant (LGPD)

#### Recomendacao
- acao_sugerida: Testes com `jest-mock-extended` + `DeepMockProxy<PrismaClient>` ou testcontainers-postgres; asserir `tenantId` em toda query
- prioridade: alta

---

### ACH-002
- titulo: Sem teste de isolamento multi-tenant ("evil twin") em use-cases críticos
- severidade: alto
- categoria: hermeticidade
- status: confirmado
- resumo: Testes passam `tenantId` em mocks, mas não validam rejeição de acesso cruzado.

#### Evidencia
- arquivo_ou_area: packages/business/sales/use-cases/__tests__/cancel-sale.test.ts; ausência generalizada

#### Impacto
- tecnico: Leak silencioso cross-tenant
- negocio: Incidente de compliance

#### Recomendacao
- acao_sugerida: Cenário "tenant A tenta acessar recurso do tenant B" rejeitado em cada use-case tenant-scoped; combinar com teste de RLS (dados-persistencia/ACH-004)
- prioridade: alta

---

### ACH-003
- titulo: `confirmSale` e baixa de estoque não possuem testes
- severidade: alto
- categoria: portfolio
- status: confirmado
- resumo: `cancelSale` tem teste; `confirmSale` não. Fluxo crítico (transação + outbox + idempotência + estoque) completamente sem cobertura (cross-ref dados-persistencia/ACH-001, confiabilidade/ACH-001).

#### Evidencia
- arquivo_ou_area: packages/business/sales/use-cases/__tests__/cancel-sale.test.ts; ausência de confirm-sale.test.ts

#### Impacto
- tecnico: Overselling sem alarme
- negocio: Prejuízo direto

#### Recomendacao
- acao_sugerida: Cobrir: sucesso, falha de estoque, race condition (Serializable), retry idempotente
- prioridade: alta

---

### ACH-004
- titulo: Sem testes genéricos de rate-limit, idempotência e outbox
- severidade: alto
- categoria: portfolio
- status: confirmado
- resumo: OTP tem rate-limit testado; rate-limit genérico (tRPC middleware), `idempotent` wrapper e outbox (publisher/subscriber/claimPending) não têm.

#### Evidencia
- arquivo_ou_area: apps/api/src/trpc/{rate-limit,idempotency}-middleware.ts; packages/shared/src/events/*

#### Impacto
- tecnico: Mecanismos de resiliência sem rede
- negocio: Duplicidade/overload sem barreira

#### Recomendacao
- acao_sugerida: Suítes para cada mecanismo; teste de concorrência para claim atômico
- prioridade: alta

---

### ACH-005
- titulo: Reset-password e forgot-password sem testes
- severidade: alto
- categoria: portfolio
- status: confirmado
- resumo: Apesar de já serem stubs (seguranca/ACH-001), nem os stubs estão testados; quando saírem de stub precisam cobertura imediata.

#### Evidencia
- arquivo_ou_area: packages/business/auth/use-cases/__tests__ (sem reset/forgot-password)

#### Impacto
- tecnico: Fluxo de recuperação sem proteção
- negocio: Sequestro de conta

#### Recomendacao
- acao_sugerida: Cobrir fluxo completo ao sair do stub (token storage, validação, expiração, consumo único)
- prioridade: alta

---

### ACH-006
- titulo: CI executa testes mas sem enforcement de coverage threshold
- severidade: medio
- categoria: pipeline
- status: confirmado

#### Evidencia
- arquivo_ou_area: .github/workflows/ci.yml; vitest.config.ts:35-40

#### Impacto
- tecnico: Coverage pode cair sem detecção
- negocio: Débito acumula

#### Recomendacao
- acao_sugerida: `pnpm vitest run --coverage`; falhar PR abaixo do threshold; artefato HTML
- prioridade: media

---

### ACH-007
- titulo: `arch:check` não é gate de CI
- severidade: medio
- categoria: pipeline
- status: confirmado

#### Evidencia
- arquivo_ou_area: .github/workflows/ci.yml (sem arch:check); .dependency-cruiser.cjs

#### Impacto
- tecnico: Barreiras arquiteturais relaxam sem alarme
- negocio: Dívida vira refactor pesado

#### Recomendacao
- acao_sugerida: Adicionar step `pnpm arch:check`; falhar em violação
- prioridade: media

---

### ACH-008
- titulo: Mocks manuais repetidos em cada teste — sem factories compartilhadas
- severidade: medio
- categoria: hermeticidade
- status: confirmado

#### Evidencia
- arquivo_ou_area: packages/business/auth/use-cases/__tests__/send-otp.test.ts:8-20

#### Impacto
- tecnico: Custo de evolução alto
- negocio: Ritmo de testes prejudicado

#### Recomendacao
- acao_sugerida: `packages/shared/src/__tests__/factories/*` com Faker; helpers `makeMockRepo<T>()`
- prioridade: media

---

### ACH-009
- titulo: Sem Redis mock/testcontainers
- severidade: medio
- categoria: hermeticidade
- status: confirmado

#### Evidencia
- arquivo_ou_area: package.json (ioredis mas sem ioredis-mock); vitest.setup.ts vazio

#### Impacto
- tecnico: Divergência entre testes e produção
- negocio: Falsa segurança

#### Recomendacao
- acao_sugerida: `ioredis-mock` para unit; testcontainers-redis para integração
- prioridade: media

---

### ACH-010
- titulo: Sem contract testing (Pact / OpenAPI)
- severidade: medio
- categoria: contratos-e-integracoes
- status: confirmado

#### Evidencia
- arquivo_ou_area: ausência de `contracts/`, `pacts/`, `trpc-openapi`

#### Impacto
- tecnico: Quebra silenciosa entre api e mobile
- negocio: Bugs de campo

#### Recomendacao
- acao_sugerida: Gerar JSON Schema a partir de Zods; snapshot em CI; Pact para parceiros
- prioridade: media

---

### ACH-011
- titulo: E2E mínimo (apenas health/login)
- severidade: medio
- categoria: portfolio
- status: confirmado

#### Evidencia
- arquivo_ou_area: e2e/health.spec.ts; playwright.config.ts

#### Impacto
- tecnico: Regressão só aparece em prod
- negocio: UX visível

#### Recomendacao
- acao_sugerida: Cenários priorizados: login → list → create sale → confirm (multi-tenant)
- prioridade: media

---

### ACH-012
- titulo: 6 de 16 módulos business sem nenhum teste
- severidade: medio
- categoria: portfolio
- status: confirmado

#### Evidencia
- arquivo_ou_area: packages/business/{analytics,ai,campaigns,landing,schedule,team}/

#### Impacto
- tecnico: Risco heterogêneo
- negocio: Alguns fluxos críticos sem rede

#### Recomendacao
- acao_sugerida: Roadmap `begin/WBC-Fase7-Testes-Roadmap.md`
- prioridade: media

---

### ACH-013
- titulo: Pre-commit não roda testes
- severidade: baixo
- categoria: pipeline
- status: confirmado

#### Evidencia
- arquivo_ou_area: .husky/pre-commit (apenas lint-staged)

#### Impacto
- tecnico: Feedback lento
- negocio: Baixo enquanto suíte é pequena

#### Recomendacao
- acao_sugerida: Na Fase 7, `pnpm vitest related --run` no pre-commit
- prioridade: baixa

---

### ACH-014
- titulo: Threshold de coverage 20% — muito baixo
- severidade: baixo
- categoria: portfolio
- status: confirmado

#### Evidencia
- arquivo_ou_area: vitest.config.ts:35-40

#### Impacto
- tecnico: Falsa sensação de segurança
- negocio: Débito

#### Recomendacao
- acao_sugerida: Escalonar: 40% Fase 6, 70% Fase 7, 80% depois
- prioridade: baixa

---

### ACH-015
- titulo: Falta `test-utils` compartilhado (context mock, assertions de domínio)
- severidade: baixo
- categoria: hermeticidade
- status: confirmado

#### Evidencia
- arquivo_ou_area: packages/shared/src/__tests__ (3 specs, sem utilitários)

#### Impacto
- tecnico: Curva de aprendizado alta
- negocio: Ritmo da Fase 7 prejudicado

#### Recomendacao
- acao_sugerida: `packages/shared/src/__tests__/test-utils/*`
- prioridade: baixa

---

### ACH-016
- titulo: CI sem matrix de Node (único LTS)
- severidade: baixo
- categoria: pipeline
- status: confirmado

#### Evidencia
- arquivo_ou_area: .github/workflows/ci.yml (sem `strategy.matrix`)

#### Impacto
- tecnico: Falha em upgrade de Node
- negocio: Downtime em manutenção

#### Recomendacao
- acao_sugerida: Matrix com Node 20 + 22; `fail-fast: false`
- prioridade: baixa
