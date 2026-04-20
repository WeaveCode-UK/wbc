# Job Schemas (ACH-012 apis-integracoes)

## Motivation

BullMQ jobs on `wbc:analytics`, `wbc:campaigns`, and `wbc:messaging`
used to land in the worker as `any`. Producer (router) and consumer
(processor) each carried their own TypeScript type; renaming a field on
the producer side didn't fail the consumer compile, so shape drift
surfaced as runtime cast errors inside the processor — retry-loop,
dead-letter, mystery.

Same strategy as event schemas (ACH-011): a registry in `@wbc/shared`
validated at both producer (`enqueueJob()`) and consumer
(`logIfInvalidJobData()` inside each processor).

## Where to look

- `packages/shared/src/jobs/schemas.ts` — the registry and helpers.
- `apps/api/src/lib/queues.ts` — `enqueueJob(queue, name, data)`
  wrapper that callers should use instead of `queue.add()` directly.
- Worker processors (`apps/worker/src/processors/*-processor.ts`) —
  each calls `logIfInvalidJobData(queue, job.name, job.data)` at the
  top of the handler.

## Registry key

`queue::name`. Most queues only have one job name; messaging has
several variants encoded inside `data.type`, so it registers under
`wbc:messaging::*` and every job on that queue runs through the same
schema.

## Warn-only during migration

A missed seed is a warn, not a reject. The registry seeds the three
jobs enqueued today; add new jobs as they ship. Flip the helpers to
throw once coverage is complete (tracked as follow-up to ACH-012).
