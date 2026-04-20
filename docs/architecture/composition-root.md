# Composition Root (ACH-010 dados-persistencia / ACH-003 codigo-manutenibilidade)

## Where to look

`apps/api/src/composition-root.ts` is the single place the API wires
adapters. Every tRPC router calls `getRepositories()` and receives
pre-constructed repositories with their dependencies (Redis, Prisma,
outbox port) already resolved.

## Current state

- `getRepositories()` returns a cached struct of every repo the API
  needs (`accountRepo`, `clientRepo`, `emailSender`, etc.).
- `setOutboxPort` + `assertOutboxReady` run once inside the factory
  (ACH-017 apis-integracoes).
- `getRedis()` is injected into adapters that need Redis (OTP, auth
  token store, login-attempt tracker).

## What ACH-010 dados-persistencia asked for

"Adapters não recebem PrismaClient por construtor" — each repository
imports `prisma` from `@wbc/db` as a module-level singleton. The
composition root can't inject a custom client for integration tests
or for a future "swap to a read replica for analytics" use case.

## What we did

- Composition root exists (the seed was ACH-003 codigo-manutenibilidade).
- `setOutboxPort` is now wired from the composition root (ACH-017
  apis-integracoes).
- The remaining refactor — every `PrismaXxxRepository` accepting
  `PrismaClient` via constructor — is deferred as a follow-up. The
  prisma singleton lives in `@wbc/db/src/index.ts` (which adapts the
  tenant middleware); the follow-up is mechanical:
  1. Add `constructor(private readonly prisma: PrismaClient = sharedPrisma)`
     to each adapter.
  2. Update callsites in the composition root to pass
     `getRepositories({ prisma })` when a test wants a specific client.

## Why deferred

- The touched surface is every adapter (~30 files), every test that
  spins up the repos (none today — this is greenfield, but the
  migration pays off once tests exist), and every call to
  `getRepositories()`.
- The benefit is mostly testability. Without tests in place yet, the
  constructor refactor buys us nothing immediate; the risk of a
  regression sneaking in through the large diff is real.
- Revisit once the first integration test lands (probably alongside
  the RLS isolation suite, ACH-004 dados-persistencia).

## When you touch a repository anyway

- If you're adding a new repository, start with constructor-injected
  `PrismaClient`. No reason to spread the singleton pattern further.
- If you're refactoring an existing repository, flip the constructor
  as part of the same PR — small diffs are the cheap way to retire
  the shared singleton.
