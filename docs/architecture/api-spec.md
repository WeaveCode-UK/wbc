# External API Specification (ACH-014 apis-integracoes)

## Why

The API is tRPC-first: the `AppRouter` type is the contract, and
TypeScript clients (web + mobile-expo) consume it via generated types.
That works beautifully until something outside the TypeScript world
needs to call the API — an iOS native rewrite, a partner integration
using Python / Ruby / Go, a no-code platform bridge. Today those
consumers have to reverse-engineer shapes from screenshots of the
code.

This doc records the two viable paths forward and what ships now.

## Option A — `trpc-openapi`

[`trpc-openapi`](https://github.com/jlalmes/trpc-openapi) attaches
OpenAPI metadata (method, path, response code) to each procedure and
generates a full spec. Pros: REST-shaped endpoints for partners that
expect REST; ready-to-import into Postman / Stoplight.

Cons: invasive — every procedure needs a `meta` annotation; some of
our tRPC idioms (superjson, context-derived tenant) don't map cleanly;
an RPC-first codebase ends up documenting a REST façade that nobody
internally uses.

Adopt this when a concrete partner needs REST. Don't pre-build it.

## Option B — `zod-to-json-schema` (what ships now)

JSON Schema generated per exported Zod schema. Pros: zero invasive
changes; one script walks `@wbc/validators` and emits
`{name}.schema.json`; sufficient for a partner who just needs to
validate inputs or generate types in another language.

Cons: no HTTP metadata (no method/path), so the partner still needs to
know the tRPC URL shape. They can be told in a short integration
guide.

`scripts/generate-api-schema.mjs` is the proof of concept — runs in
Node, picks a schema by name, prints JSON Schema:

```bash
pnpm add -D zod-to-json-schema --filter <pkg>
node scripts/generate-api-schema.mjs createClientSchema
```

The output looks like:

```jsonc
{
  "$ref": "#/definitions/createClientSchema",
  "definitions": { "createClientSchema": { ... } }
}
```

## Decision log

- **Today**: ship the generator (stub above) so a partner can get a
  JSON Schema with one command. Don't commit the generated files; let
  the partner regenerate on-demand to avoid stale artefacts.
- **When we sign the first external partner**: evaluate whether
  OpenAPI + `trpc-openapi` clears their bar, and invest only then.
- **If and when we add REST endpoints**: put them in
  `apps/web/src/app/api/v1/*` (parallel to tRPC) and build OpenAPI
  from those, not from the tRPC routes.
