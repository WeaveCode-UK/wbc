# WBC Fase 7 — Roadmap de Testes

Semeado pela correção da auditoria testes-qualidade (run `2026-04-19_07-59-20`).
Serve como referência durante a Fase 7, quando a regra "ZERO testes até Fase 7"
(CLAUDE.md) é suspensa.

Cada ACH abaixo referencia o achado original da auditoria e define o que
precisa ser escrito. A ordem é **sugerida por impacto**, não rígida — cada
épico da Fase 7 pode escolher entrar por um ponto diferente.

---

## Bloco 1 — Persistência (ACH-001 alto)

**Objetivo:** nenhum repository Prisma sem teste.

- Setup: `jest-mock-extended` + `DeepMockProxy<PrismaClient>` OU
  testcontainers-postgres para integração.
- Por repository:
  - CRUD feliz.
  - Constraint violation (unique, FK).
  - Multi-tenant: tenantId obrigatório em toda query (cross-ref ACH-002).
  - Optimistic lock onde aplicável (ACH-003 dados-persistencia).

**Alvos iniciais:** sale, client, product, outbox.

---

## Bloco 2 — Isolamento multi-tenant (ACH-002 alto)

**Objetivo:** evil twin por use-case tenant-scoped.

- Helper pronto: `mockTenantPair()` em
  `packages/shared/src/__tests__/test-utils/mock-tenant-ctx.ts`.
- Para cada use-case: cenário "tenant A tenta acessar recurso do tenant B
  → rejeitado com tenant mismatch error".
- Combinar com teste de RLS em Postgres (dados-persistencia ACH-004).

---

## Bloco 3 — Fluxo de venda (ACH-003 alto)

**Objetivo:** `confirmSale` com cobertura completa.

- Caminho feliz: stock decrement + outbox publish + cashback apply.
- Caminho de falha de estoque: rollback transação, evento não publicado.
- Race condition: Serializable isolation sob concorrência.
- Retry idempotente: chamar duas vezes com mesma key não duplica efeito
  (cross-ref ACH-001 confiabilidade-resiliencia — processed_events).

---

## Bloco 4 — Mecanismos de resiliência (ACH-004 alto)

**Objetivo:** rate-limit genérico, idempotency wrapper, outbox publisher/
subscriber, claimPending atômico.

- Rate-limit middleware: verificar bucket por rota e por identificador.
- `idempotent(key, fn)` wrapper: chamada duplicada retorna valor cacheado
  sem re-executar fn; TTL expira e re-executa.
- Outbox publisher: publish salva no repo e anexa metadata com traceparent
  (ACH-011 observabilidade).
- Outbox subscriber: dispatch propaga falhas (ACH-001 confiabilidade) +
  withIdempotentHandler no piloto (ACH-002 confiabilidade).
- Claim atômico: teste de concorrência com dois workers; cada um pega rows
  disjoint via `FOR UPDATE SKIP LOCKED`.

---

## Bloco 5 — Autenticação (ACH-005 alto)

**Objetivo:** reset-password + forgot-password com cobertura imediata
quando saírem de stub.

- Request reset: gera token único, persiste hash, envia email.
- Consumir reset: token válido → password muda; token usado → rejeitado;
  token expirado → rejeitado.
- Rate-limit específico já existe em `SENSITIVE_ROUTE_LIMITS`; testar que
  X tentativas em janela dispara 429.

---

## Bloco 6 — Mocks & isolamento (ACH-008, ACH-009, ACH-015)

- ACH-008: migrar mocks manuais repetidos para factories em
  `packages/shared/src/__tests__/factories/*`.
  Seed pronto: `make-mock-repo.ts` (substituir Proxy por vi.fn() real).
- ACH-009: `ioredis-mock` para testes unitários; testcontainers-redis para
  integração (rate-limit, idempotency cache, DLQ).
- ACH-015: expandir `test-utils/*` — `withFixedTime`, `assertDomainInvariant`.

---

## Bloco 7 — Contratos (ACH-010 medio)

- Gerar JSON Schema a partir dos schemas Zod do tRPC.
- Snapshot em CI para detectar breaking change silenciosa entre api e mobile.
- Pact para integrações externas (futuro).

---

## Bloco 8 — E2E (ACH-011 medio)

Expandir playwright além de `health` / `login`:

- Cenário completo: login → criar cliente → criar venda → confirmar →
  verificar cashback creditado.
- Multi-tenant: alice e bob não veem clientes um do outro.
- WhatsApp webhook ingest → evento criado → handler processado.

---

## Bloco 9 — Cobertura dos módulos órfãos (ACH-012 medio)

6 módulos hoje sem nenhum teste:
`analytics`, `ai`, `campaigns`, `landing`, `schedule`, `team`.

Priorizar pela exposição a bugs em produção:

1. `campaigns` (lida com dispatch para muitos tenants)
2. `schedule` (lidar com timezone é famoso bug farm)
3. `analytics` (queries agregadoras caem em corner cases)
4. `ai`, `landing`, `team`

---

## Escalonamento de coverage (ACH-014)

Ver `vitest.config.ts` — threshold escala:

- Fase 4 (hoje): 20%
- Fase 6: 40%
- Fase 7 (ao fim): 70%
- Estável: 80%

O gate de CI falha se coverage cair abaixo do threshold atual.

---

## Gates de CI já no lugar (ACH-006, ACH-007, ACH-013, ACH-016)

- `pnpm test:coverage` no workflow — **on**.
- `pnpm arch:check` — **on**.
- Matrix Node 20 + 22 — **on**.
- Pre-commit roda testes relacionados — **off** (ativar em Fase 7).
