# API Filtering & Sorting (ACH-009 apis-integracoes)

## Problem

Today each list endpoint grew its own filter naming: `clients.list` uses
`search`/`classification`/`tagIds`/`isLead`, `sales.list` uses
`status`/`clientId`, `finance.list` uses `category`. No `sort` anywhere.
An SDK consumer has to memorise the shape per-route and web/mobile code
picks a slightly different subset each time.

## Canonical shape (new endpoints)

```ts
z.object({
  ...paginationSchema.shape,
  filters: z
    .object({
      /* route-specific filters, all optional */
    })
    .optional(),
  sort: z
    .object({
      by: z.string(),
      order: z.enum(["asc", "desc"]).default("desc"),
    })
    .optional(),
});
```

Rules:

- **`filters`** — single object per route, all fields optional, each
  field narrowed to what the underlying query can cheaply use. Never
  free-form strings; if a filter would otherwise be freeform, wrap it
  in a Zod `enum` or shaped object. Keeps attack surface small and the
  SDK type narrow.
- **`sort`** — `by` is an enum of column names the query whitelists.
  Reject unknown values at the validator level so the repo never sees a
  bad column name. Default `desc` unless the route has a natural
  alphabetical ordering (e.g. catalog).
- **No top-level filter fields.** Keep them namespaced under `filters`
  so (a) the envelope is consistent across routes, (b) adding a filter
  doesn't collide with `page`/`limit`/`sort`.

## Migrating an existing route

1. Keep the old top-level fields as deprecated — mirror them into
   `filters` internally until every caller moves over.
2. Add a `sort` field when the route can cheaply sort by more than
   `createdAt desc` (check the index).
3. Update the client generator once the new shape stabilises.

## Follow-up

- Migrate `clients.list`, `sales.list`, `finance.list`, `campaigns.list`,
  `inventory.listOrders`, `catalog.listProducts` — the six with existing
  ad-hoc filters.
- Add a lint rule rejecting top-level inputs named `filter*` /
  `search` / `status` in `.list` procedures once the migration lands.
