# ADR-001 — tRPC HTTP exposure status (ACH-010)

## Status

Accepted — 2026-04-27. Supersedes the implicit assumption that
`apps/api/src/routers` was reachable via HTTP.

## Context

A 2026-04-26 security audit (run `2026-04-26_15-46-36`, finding
ACH-010) confirmed that **none** of the 19 tRPC routers in
`apps/api/src/routers/*` are reachable via HTTP today.

Concretely:

- `apps/api/src/index.ts` only initialises tracing, Sentry, Prisma and
  the metrics server. No `app.listen` / `fetchRequestHandler` /
  `fastify` / `express`.
- `apps/web` has no `app/api/trpc/[trpc]/route.ts` and the
  `createTRPCNext` / `createTRPCReact` clients are not present.
- The 18 routers (auth, clients, finance, sales, etc., plus the new
  `mfa` namespace) define ~123 procedures in total — all of which are
  effectively dormant from an external-attack-surface perspective.

The result is a divergence between **intent** (a CRM with 18 functional
domains) and **reality** (auth + webhooks + metrics).

## Decision

We accept the **deferred-wiring** posture for now and document it
explicitly:

1. The routers stay where they are. No code is moved or feature-flagged.
2. Every audit recommendation that depends on those routers (BFLA,
   BOLA, payload-validation, etc.) is treated as **latent** — its
   correction lands now, but its exploitation is gated on the wiring.
3. Before the wiring lands (`apps/web/src/app/api/trpc/[trpc]/route.ts`
   - `createTRPCNext` client), a re-audit must run to confirm that
     every Phase 2-19 finding still holds against the new surface.

## Wiring plan (not yet executed)

When the team is ready to expose tRPC over HTTP, the steps are:

1. Add `apps/web/src/app/api/trpc/[trpc]/route.ts`:
   ```ts
   import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
   import { appRouter } from "@wbc/api/trpc/router";
   import { createContext } from "@wbc/api/trpc/context";
   export const POST = (req: Request) =>
     fetchRequestHandler({
       endpoint: "/api/trpc",
       req,
       router: appRouter,
       createContext,
     });
   export const GET = POST;
   ```
2. Add the trpc client wrappers in `apps/web/src/lib/trpc.ts` using
   `createTRPCReact` + `httpBatchLink`.
3. Re-run the security audit (`/audit-run seguranca`) before promoting
   to staging.
4. Burn rate alerts on `wbc_trpc_request_duration_seconds_bucket` are
   already in place; nothing new on the metrics side.
5. Update `docs/SURFACE-INVENTORY.md` to mark each router as
   "exposed".

## Consequences

- **Pros**: the team can keep landing security corrections (RLS, BFLA
  gates, audit log) on the dormant routers; when they go live, the
  surface is already hardened.
- **Cons**: the documented architecture (routers + database +
  application logic) does not match the deployed surface. New
  contributors must read this ADR to avoid wasting time looking for an
  HTTP entry point that does not exist.

## References

- `Auditoria/seguranca/runs/2026-04-26_15-46-36/findings.json` —
  finding `ACH-010`.
- `Auditoria/seguranca/runs/2026-04-26_15-46-36/correcao/correction.json`
  — entry for `ACH-010`.
- `apps/api/src/index.ts` — current dormant entry point.
