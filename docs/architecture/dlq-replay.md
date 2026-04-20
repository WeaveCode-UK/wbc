# DLQ Observability & Replay (ACH-020 apis-integracoes)

## What DLQ looked like before

`dlq-processor.ts` caught the job, wrote one `warn` with three fields,
and acked. Nothing paged ops; no structured context made it out; no
reusable replay path existed. Chronic failures stayed invisible until
someone manually inspected Redis.

## What it looks like now

1. **Structured log** (always on). Every DLQ entry carries:
   - `originalQueue`, `originalJobId`
   - `tenantId`
   - `attempts` (how many times BullMQ retried)
   - `firstFailedAt`, `lastFailedAt`
   - the truncated error message.

   Any log aggregator can slice: count per `originalQueue`, spike per
   tenant, top error strings.

2. **Optional fanout** (opt-in via env).
   - `SENTRY_DSN` — `Sentry.captureMessage` with the enriched context;
     DLQ events show up as warnings in the worker project.
   - `SLACK_WEBHOOK_URL` — one-liner posted to the ops channel. Meant
     for on-call visibility on staging/prod; leave unset in dev.

   A failure during fanout never re-throws; the DLQ consumer always
   acks.

## Replay (manual, today)

```bash
# See the DLQ depth
redis-cli -u $REDIS_URL --scan --pattern 'bull:wbc:dlq:*'

# Inspect one entry
redis-cli -u $REDIS_URL get 'bull:wbc:dlq:<id>'
```

From there, decide:

- **Fix the root cause, then re-enqueue** the original payload into
  its queue: `node scripts/enqueue-job.mjs <queue> <name> '<json>'`
  (script does not exist yet — tracked follow-up).
- **Drop the entry** when the failure was a one-off (flaky external
  API) and a fresh domain event will retry the work naturally.

## Follow-up

- CLI replay command (`audkit-dlq replay <id>`), stubbed in this
  achado's recommendation. Needs a queue-name → processor registry
  so we don't accidentally re-run with the wrong consumer.
- Grafana dashboard panel that graphs DLQ count by `originalQueue`.
  We already have the Loki labels; just needs the panel JSON checked
  in.
- Alertmanager rule that pages on a DLQ rate spike (e.g. > 5 entries
  in 5 min on any queue).
