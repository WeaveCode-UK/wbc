// T5.2 — RLS bypass attempt against a real Postgres.
//
// WHY: `001_rls_policies.sql` (now folded into the
// `20260421000005_rls_policies` migration) is what stops a tenant from
// reading another tenant's rows. Existing unit-style tests can't
// exercise the actual policy engine — only Postgres can. This file
// confirms three things end-to-end:
//   1. with no `app.current_tenant_id` set, queries return zero rows
//      (the policy's `current_setting(..., true)::uuid` is NULL → never
//      matches);
//   2. with a different tenant's UUID set, queries return zero rows;
//   3. with the correct tenant's UUID set, the seeded row comes back.
//
// The wrapper under test (`withRlsTenantContext`) does (3) by stamping
// `SET LOCAL app.current_tenant_id` inside a transaction.

import { describe, it, beforeAll, afterAll, expect } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { applyMigrations, SHOULD_RUN_INTEGRATION } from "./_helpers";
import { withRlsTenantContext } from "../../rls/with-rls-tenant-context";

describe.skipIf(!SHOULD_RUN_INTEGRATION)("RLS bypass attempt", () => {
  let container: StartedPostgreSqlContainer;
  let prisma: PrismaClient;
  let appPrisma: PrismaClient;
  const TENANT_A = "11111111-1111-1111-1111-111111111111";
  const TENANT_B = "22222222-2222-2222-2222-222222222222";

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:16-alpine")
      .withCommand(["postgres", "-c", "shared_buffers=128MB"])
      .start();
    const adminUrl = container.getConnectionUri();
    applyMigrations(adminUrl);

    // WHY: testcontainers gives us a SUPERUSER role by default which
    // automatically bypasses RLS (BYPASSRLS attribute). To exercise the
    // policy at all we have to create a *non-superuser* role and run
    // the queries through it. The `appPrisma` client connects as that
    // role; `prisma` (admin) is reserved for seeding/cleanup.
    prisma = new PrismaClient({ datasources: { db: { url: adminUrl } } });
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'wbc_app') THEN
          CREATE ROLE wbc_app LOGIN PASSWORD 'wbc_app';
        END IF;
      END $$;
    `);
    await prisma.$executeRawUnsafe(`GRANT ALL ON SCHEMA public TO wbc_app`);
    await prisma.$executeRawUnsafe(
      `GRANT ALL ON ALL TABLES IN SCHEMA public TO wbc_app`,
    );
    await prisma.$executeRawUnsafe(
      `GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO wbc_app`,
    );

    // Build a non-superuser DSN by swapping credentials and stripping
    // any pre-existing schema/role hints.
    const u = new URL(adminUrl);
    u.username = "wbc_app";
    u.password = "wbc_app";
    appPrisma = new PrismaClient({
      datasources: { db: { url: u.toString() } },
    });

    // Seed two tenants and one client per tenant, via the admin client.
    await prisma.tenant.createMany({
      data: [
        { id: TENANT_A, name: "A", slug: "a-rls" },
        { id: TENANT_B, name: "B", slug: "b-rls" },
      ],
    });
    await prisma.client.createMany({
      data: [
        {
          tenantId: TENANT_A,
          name: "Alice",
          phone: "+5511000000010",
        },
        {
          tenantId: TENANT_B,
          name: "Bob",
          phone: "+5511000000020",
        },
      ],
    });
  }, 120_000);

  afterAll(async () => {
    await appPrisma?.$disconnect();
    await prisma?.$disconnect();
    await container?.stop();
  });

  it("query without SET app.current_tenant_id returns 0 rows", async () => {
    // WHY: outside any transaction with SET LOCAL, the policy's
    // `current_setting(..., true)` resolves to NULL; the cast to uuid
    // fails inside the policy's USING clause and Postgres treats the
    // row as filtered out.
    const rows = await appPrisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM clients
    `;
    expect(rows).toHaveLength(0);
  });

  it("query with the wrong tenant returns 0 rows for the other tenant's data", async () => {
    const rows = await withRlsTenantContext(
      TENANT_B,
      (tx) =>
        tx.$queryRaw<Array<{ id: string; tenantId: string }>>`
          SELECT id, "tenantId" FROM clients WHERE name = 'Alice'
        `,
      appPrisma,
    );
    expect(rows).toHaveLength(0);
  });

  it("query with the correct tenant returns the seeded row", async () => {
    const rows = await withRlsTenantContext(
      TENANT_A,
      (tx) =>
        tx.$queryRaw<Array<{ id: string; tenantId: string; name: string }>>`
          SELECT id, "tenantId", name FROM clients
        `,
      appPrisma,
    );
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.tenantId).toBe(TENANT_A);
    }
  });

  it("rejects malformed tenantId at the application boundary (defence in depth)", async () => {
    await expect(
      withRlsTenantContext(
        // WHY: the wrapper interpolates the value into raw SQL after a
        // UUID regex check. A non-UUID must be rejected before the SET
        // LOCAL statement is even built.
        "not-a-uuid'; DROP TABLE clients; --",
        async () => "should not reach here",
        appPrisma,
      ),
    ).rejects.toThrow(/UUID/);
  });
});
