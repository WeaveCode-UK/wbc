import { prisma } from "../index";
import type { Prisma, PrismaClient } from "@prisma/client";

/**
 * ACH-013 seguranca: runtime activation of the row-level security policies
 * declared in `migrations/manual/001_rls_policies.sql`. The policies key on
 * `current_setting('app.current_tenant_id')` — without a SET LOCAL on the
 * connection, that setting is NULL and the policies fail closed (or
 * silently bypass when the connection role has BYPASSRLS).
 *
 * Wrap any query that must be RLS-enforced like:
 *
 *   const sales = await withRlsTenantContext(tenantId, (tx) =>
 *     tx.sale.findMany({ where: { createdAt: { gte: monthStart } } }),
 *   );
 *
 * The wrapper opens a transaction, stamps `app.current_tenant_id`, and then
 * runs the caller-provided block against the transactional client. The
 * setting is local to the transaction (PostgreSQL `SET LOCAL`), so it is
 * automatically cleared on commit/rollback even under connection pooling.
 *
 * Repositories migrated incrementally (introducing the wrapper around the
 * outermost write/read) can co-exist with repositories still using the bare
 * `prisma` client; the existing `applyTenantMiddleware` continues to enforce
 * tenantId at the application layer.
 */
export async function withRlsTenantContext<T>(
  tenantId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  client: PrismaClient = prisma,
): Promise<T> {
  if (!isUuid(tenantId)) {
    // Defence in depth: the SET LOCAL is interpolated raw into the SQL
    // string. We only allow well-formed UUIDs to reach the database to
    // remove any user-controlled-injection surface entirely.
    throw new Error(
      `withRlsTenantContext: tenantId must be a UUID (received "${tenantId}")`,
    );
  }
  return client.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `SET LOCAL app.current_tenant_id = '${tenantId}'`,
    );
    return fn(tx);
  });
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
