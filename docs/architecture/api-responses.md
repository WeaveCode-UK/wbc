# API Response Shapes (ACH-006 / ACH-007 / ACH-010 apis-integracoes)

## Canonical shapes

New code and migrated code should return one of four envelope shapes,
all exported from `apps/api/src/trpc/responses.ts`:

| Helper           | Shape                                    | Use for                                   |
| ---------------- | ---------------------------------------- | ----------------------------------------- |
| `ok(data)`       | `{ success: true, data }`                | Mutation success                          |
| `fail(code, m?)` | `{ success: false, error: { code, … } }` | Mutation failure with a domain error code |
| `itemOk(data)`   | `{ data }`                               | Query returning one entity                |
| `listOk(data,…)` | `{ data, meta }`                         | Query returning a list (pagination meta)  |

`MutationResult<T>` is the discriminant union of `ok` and `fail` — use
it when the SDK generator wants a single return type.

## Dates and timezones (ACH-010)

Every date on the wire is **ISO 8601 UTC** (`YYYY-MM-DDTHH:mm:ssZ`).
`superjson` already serialises `Date` to ISO; don't bypass it. When a
response needs to show local time, clients convert to the tenant's
timezone via the `tenantTimezone` field in `health.version`.

## Error codes

Prefer stable, opaque codes that the client can key on:

```
fail("CLIENT_NOT_FOUND")
fail("INSUFFICIENT_STOCK", "Only 2 units left")
```

Leave translation to the client (i18n); the `message` field is for
ops debugging, not user display.

## Migration (follow-up)

The audit finding calls for consistency across every procedure. That
touches every router. The pragmatic path:

1. New procedures land with the helpers from day one.
2. When you touch a procedure for any other reason, migrate its return.
3. A follow-up PR sweeps the remainder once the critical-path routes
   are stable.

## Pagination meta (ACH-007)

`listOk()` fills `{ page, limit, total, hasMore }` consistently. A few
endpoints (analytics, audit-trail, logs) will eventually move to
cursor-based pagination; the envelope already includes an optional
`nextCursor` so the shape doesn't break when we flip them.
