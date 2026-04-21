# Delete Policy (ACH-008 dados-persistencia)

## Problem

Today the codebase soft-deletes `TenantMember.deletedAt` but
hard-deletes everywhere else. No documentation explains why, and the
audit flagged the inconsistency as semantically confusing and LGPD-
risky.

## Policy

**Default: hard delete + archive.** Most entities are hard-deleted.
When the fiscal / legal / audit story requires retention, the row
goes to an archive table (see `data-retention.md`), not a `deletedAt`
column.

**Exception: `TenantMember.deletedAt`.** The audit trail of "who was
in what tenant when" is load-bearing for multi-tenant billing
disputes. Keeping the row with `deletedAt` set (and filtering it out
of normal reads) beats exporting to an archive table because every
query path already handles the filter via Prisma middleware.

## Why not soft-delete everywhere

- **Query cost** — every read has to carry `deletedAt IS NULL`; a
  missed filter leaks deleted data.
- **LGPD** — a user exercising the right-to-deletion expects their
  row to actually go away. Soft-delete + retention schedule is more
  honest than "it's still there but we promise not to read it."
- **Semantics** — `Sale { deletedAt }` is ambiguous: cancelled sale?
  refunded sale? accounting reversal? Hard-delete-or-archive forces
  the domain to pick one.

## Rules

1. New models do **not** add `deletedAt` without explicit review.
2. When retention is required, add the entity to
   `data-retention.md` and plan the archive flow instead.
3. Right-to-deletion requests hard-delete the user's rows across
   every tenant-scoped table, cascading through FKs. An "erased_at"
   audit row records the request for compliance.

## Migration note

`TenantMember.deletedAt` stays as-is. If future work expands
soft-delete to other models, add the justification to this doc
first — don't let the pattern spread by osmosis.
