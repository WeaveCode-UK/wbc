# Event Schemas (ACH-011 apis-integracoes)

## Motivation

Events persisted in the outbox travel with `type: string` and
`payload: unknown`. Consumers used to cast those payloads from memory of
the producer's TypeScript types — fragile across deploys, silent on
drift. A renamed field shipped at 14:00 made the consumer quietly
explode at 14:10 and nothing told us why.

This registry moves the contract from "whoever wrote the producer last"
into a Zod-validated surface that both sides consult.

## How it works

- `packages/shared/src/events/schemas.ts` exports
  `eventSchemaRegistry: Partial<Record<EventType, ZodSchema>>`.
- The publisher (`publish()`) calls `logIfInvalidEventPayload()` before
  persisting. A failing schema emits a structured warn; unseeded events
  emit a separate warn so ops can prioritise.
- The consumer (`apps/worker/src/processors/outbox-processor.ts`)
  re-validates when it pulls the event off the outbox. Same warn-only
  behaviour — the drift shows up in logs twice (publish time and process
  time), which is how we detect schema skew across deploys.

## Why warn-only

40+ event types already ship. Turning validation into a hard reject at
publish time means a missed seed blocks real mutations the moment the
change merges. Warn-only lets us:

1. Seed the schemas module-by-module as work in the affected module
   touches the payload shape.
2. See the gap in production logs without causing outages.
3. Flip to strict once the registry has full coverage (tracked follow-up).

## Naming

Event type names live in `domain-event.ts` and follow `module.action`
today (`sale.confirmed`, `campaign.dispatched`). When a payload shape
needs a breaking change, add a versioned variant (`sale.confirmed.v2`)
and migrate consumers; keep the old type registered alongside the new
one until every consumer moves over.

Do **not** rename an existing event in place — consumers still in the
old deploy will silently stop processing it.

## Seeding a new schema

1. Author the shape in `schemas.ts`. Use `.passthrough()` unless you
   want extra producer fields to fail validation.
2. Register it under the matching `EVENTS.*` key.
3. Producer and consumer start emitting/consuming validation logs; fix
   any drift surfaced before merging.

## Follow-up

- Seed the remaining event types (the registry starts with three as
  reference).
- Flip warn to hard-reject at publish once coverage is complete.
- Add a CI check that fails if a new `publish<T>(EVENTS.X, ...)` call
  lands without a matching schema entry.
