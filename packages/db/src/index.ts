import { PrismaClient } from "@prisma/client";
import { createTenantMiddleware } from "./middleware/tenant-middleware";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Pool tuning. Prisma defaults to `num_physical_cpus * 2 + 1` connections
// and a 10s pool_timeout, which is fine for steady-state but two things
// bit us during the /schedule QA incident:
//   1. A slow query (e.g. unbounded findMany) holds its connection past
//      pool_timeout, so subsequent requests queue and the dev server
//      starts returning 503 in cascade.
//   2. If the DB is briefly unreachable, `connect_timeout` defaults to
//      *forever* — first query of a cold worker hangs instead of erroring.
// We pin both values explicitly so the behavior is the same on every
// machine, and we shorten connect_timeout so a misconfigured DATABASE_URL
// fails the request fast instead of timing out at the browser layer.
function tunedDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    const ensure = (key: string, value: string): void => {
      if (!parsed.searchParams.has(key)) parsed.searchParams.set(key, value);
    };
    ensure("connection_limit", "10");
    ensure("pool_timeout", "10");
    ensure("connect_timeout", "10");
    return parsed.toString();
  } catch {
    return url;
  }
}

const tunedUrl = tunedDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["error"],
    ...(tunedUrl ? { datasources: { db: { url: tunedUrl } } } : {}),
  });

let tenantMiddlewareApplied = false;

export function applyTenantMiddleware(
  getTenantId: () => string | undefined,
): void {
  if (tenantMiddlewareApplied) return;
  prisma.$use(createTenantMiddleware(getTenantId));
  tenantMiddlewareApplied = true;
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export { PrismaClient } from "@prisma/client";
export * from "@prisma/client";
export { createTenantMiddleware } from "./middleware/tenant-middleware";
export { createSlowQueryMiddleware } from "./middleware/slow-query-middleware";
export { PrismaOutboxRepository } from "./outbox/prisma-outbox-repository";
export { ProcessedEventRepository } from "./outbox/processed-event-repository";
// ACH-013 seguranca: opt-in helper that activates RLS policies at runtime
// by stamping `app.current_tenant_id` per transaction. See file header
// for the rollout pattern.
export { withRlsTenantContext } from "./rls/with-rls-tenant-context";
