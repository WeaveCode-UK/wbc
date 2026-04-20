# API Idempotency (ACH-001 apis-integracoes)

## Problem

Before this change, `idempotent()` was wired into `sales.*` and
`finance.*` only. Every other `create/confirm/send/mark` mutation was
vulnerable to a client-side retry producing a duplicate side-effect:
two brand orders, two WhatsApp messages, two campaign dispatches.

A TCP retry, an overenthusiastic React StrictMode, a double-tap on
"Confirm" — any of them re-ran the mutation on a separate tRPC call.

## Today

Three pieces in `apps/api/src/trpc/idempotency-middleware.ts`:

1. `idempotent(key, handler)` — existing primitive: Redis GET/SET with
   24 h TTL, skipped when `key` is `undefined`.
2. `deriveIdempotencyKey(route, tenantId, input)` — stable hash of
   `{route, tenantId, sha256(canonical(input))}`. Used as fallback
   when the client doesn't send a key.
3. `idempotentRoute(route, tenantId, input, handler)` — glue: looks
   at `input.idempotencyKey`, falls back to the derived key, emits a
   structured warn so we can see migration progress in production.

Routers call:

```ts
.mutation(async ({ ctx, input }) => {
  return idempotentRoute(
    "campaigns.confirm",
    ctx.tenant.tenantId,
    input,
    () => confirmCampaign(...),
  );
});
```

Input schemas gain an optional `idempotencyKey: z.string().min(1).optional()`.

## Coverage

**Done in this PR:**

- `messaging.sendToClient`
- `campaigns.confirm`
- `clients.create`
- `inventory.createOrder`, `inventory.receiveOrder`

Also wired: when `messaging.sendToClient` calls the WhatsApp adapter,
the same idempotency key is forwarded as `X-Request-Id` (ACH-016), so
a retry coalesces on Meta's side too.

**Follow-up (deferred):**

The achado calls for coverage of _every_ `create/confirm/send/mark/
accept/cancel` mutation. The wrapper is ready; the remaining routers
(`auth`, `catalog`, parts of `team`, `schedule`, `finance` beyond
current coverage, etc.) need the same three-line change. Do it in a
dedicated migration PR — it touches ~25 procedures and merges poorly
with concurrent feature work.

**Flip switch:**

Once every mutation migrates, replace the warn-with-fallback in
`resolveIdempotencyKey()` with a hard 400 — clients that skip the key
should fail loudly, not silently.

## Derived-key gotchas

- Input canonicalisation does a shallow key-sort. Nested objects
  rely on `JSON.stringify`'s default ordering. If you find a callable
  where that matters, pass an explicit `idempotencyKey`.
- Dates serialize to ISO strings; the same `new Date()` on two
  consecutive retries yields two different hashes. Either pass a key
  or pre-serialize the date on the client.
