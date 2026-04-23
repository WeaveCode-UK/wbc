# test-utils compartilhado

ACH-015 testes-qualidade. Helpers para reduzir boilerplate em testes
quando a Fase 7 começar.

## Conteúdo planejado

- `mock-tenant-ctx.ts` — cria contexto de tenant para testes que rodam
  dentro de `runWithTenant`.
- `assert-domain-invariant.ts` — assertions padronizadas para
  invariantes comuns (tenantId presente, totais não-negativos).
- `with-fixed-time.ts` — wrapper que trava `Date.now()` em um instante
  fixo (útil para backoff, expirations).
- `evil-twin.ts` — helper para teste "tenant A tenta acessar recurso
  de tenant B" (ver ACH-002 testes-qualidade).

## Uso

Imports de `@wbc/shared/test-utils` (futuro subpath export). Por
enquanto, `packages/shared/src/__tests__/test-utils/*` só é acessível
pelos testes internos do shared — ok até a Fase 7.
