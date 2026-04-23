# Audit Log (ACH-020)

LGPD art. 37 exige capacidade de demonstrar conformidade com o
princípio da **responsabilização** — quem acessou/alterou dados pessoais,
quando, e com que finalidade.

## Schema

`packages/db/prisma/migrations/manual/005_audit_log.sql` com RLS.

Campos:

- `tenantId` — escopo multi-tenant.
- `actorId` / `actorType` — quem fez a ação (`user`, `system`, `worker`, `admin`).
- `action` — `read`, `create`, `update`, `delete`, `export`, `anonymize`.
- `resource` + `resourceId` — alvo da ação.
- `ipAddress` + `userAgent` — evidência.
- `diff` (JSONB) — `{ before, after }` para updates.
- `createdAt`.

## Middleware (follow-up)

Ainda a implementar: middleware tRPC que escreve em `AuditLog` quando:

- Mutation cria/atualiza/deleta um Client, Account, Sale, ou qualquer
  entidade listada em `AUDITABLE_RESOURCES`.
- Query que lista ou exporta dados pessoais.

```ts
// Esboço — a implementar em apps/api/src/trpc/audit-middleware.ts
export const auditMiddleware = t.middleware(async ({ ctx, next, path, type, rawInput }) => {
  const result = await next();
  if (isAuditable(path, type)) {
    await prisma.auditLog.create({
      data: {
        id: uuidv4(),
        tenantId: ctx.tenantId!,
        actorId: ctx.userId,
        actorType: 'user',
        action: inferAction(path, type),
        resource: inferResource(path),
        resourceId: extractResourceId(rawInput, result),
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        diff: type === 'mutation' ? computeDiff(...) : undefined,
      },
    });
  }
  return result;
});
```

## Retenção

Ver `docs/DATA_RETENTION_POLICY.md` — linha "AuthAuditLog / AuditLog":
90 dias ativo + 90 dias pós-rescisão = 180 dias máximo.

## Consultas

- Via endpoint `privacy.accessLog` (ACH-001) — titular consulta seu próprio.
- Admin: query direta via painel admin (a criar em `apps/web/src/app/(admin)/audit`).

## Pendências humanas

1. Modelo Prisma (`AuditLog`) no `schema.prisma` após aplicar migration.
2. Middleware tRPC (esboço acima — finalizar).
3. Worker de retenção (`audit-log-retention`).
4. UI admin de consulta.
5. Testes (após Fase 7) — validar que mutation gera exatamente 1 entrada.
6. Decidir diff strategy — JSON Patch vs JSON diff. Recomendação: JSON
   Patch (ECMA-404) para estabilidade.
