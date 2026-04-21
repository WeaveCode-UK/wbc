# Data Retention & Archive (ACH-019 dados-persistencia)

## Why

Today, only the outbox has a cleanup worker (`outbox-cleanup.ts` →
`cleanupProcessedOutboxEvents`). Every other tenant-scoped table
grows unbounded. Disk cost climbs, backups take longer to run,
indexes degrade as pages fragment, and queries that should scan
"last 90 days" quietly scan "all time".

## Policy (first pass)

| Entity                        | Retention (hot) | Archive | Rationale                                             |
| ----------------------------- | --------------- | ------- | ----------------------------------------------------- |
| `outbox_events`               | 30 d            | delete  | Already implemented                                   |
| `processed_events`            | 180 d           | delete  | Idempotency window — 6 months is generous vs. retries |
| `cashback_redemptions`        | 730 d (2 y)     | archive | Financial / fiscal records; export to cold storage    |
| `ai_generations`              | 90 d            | archive | Debugging + billing; cold storage after quarter-close |
| `notifications`               | 60 d            | delete  | Informational, fast-decay value                       |
| `scheduled_messages`          | 60 d after send | delete  | Sent is terminal, no business use                     |
| `reminders` (sent)            | 90 d after send | delete  | Same                                                  |
| `post_sale_flows` (completed) | 180 d           | delete  | Debugging window                                      |
| `sales`                       | keep            | never   | Fiscal / legal — never delete                         |
| `payments`                    | keep            | never   | Fiscal / legal                                        |
| `clients`                     | keep            | never   | LGPD right-to-deletion handled separately             |

The policy is intentionally conservative — nothing tagged "archive"
is deleted in place. Before the archive step is automated, a human
reviews the sample and signs off.

## Framework

`packages/db/src/archive/base-archiver.ts` (stub added in this PR)
provides the shape every per-entity archiver should implement:

- `archive(olderThan: Date): Promise<{ archived: number }>` —
  exports eligible rows to the cold store (S3 JSON lines today, ICEBERG
  table eventually) and deletes from Postgres in the same tx.
- `purge(olderThan: Date): Promise<{ deleted: number }>` — deletes
  without exporting (for the entities in the "delete" column above).

Per-entity archivers inherit from it and pin (a) the cold-store
prefix, (b) the serialisation, (c) any pre-archive hook (e.g.
redact PII).

## Follow-up

- First archiver: `NotificationArchiver` (highest volume, lowest
  stakes).
- Wire archivers into the worker loop alongside the existing DLQ
  archive + outbox cleanup.
- Cold store: S3 bucket with a 7-year retention policy per fiscal
  requirement; lifecycle rule moves to Glacier after 1 y.
- Document the restore-from-archive flow once the first archiver
  ships.
