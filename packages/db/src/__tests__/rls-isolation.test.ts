// ACH-004 dados-persistencia: regression harness for tenant isolation.
//
// The `001_rls_policies.sql` migration installs `tenant_isolation_*`
// policies on ~19 tables. A silent regression — dropping the policy,
// forgetting to add one on a new table, or bypassing
// `app.current_tenant_id` — leaks data across tenants. This test
// populates two tenants and confirms that queries under tenant A only
// ever see tenant A's rows.
//
// The test is opt-in (`TEST_DATABASE_URL` must be set) because it
// needs a real Postgres with the migrations and RLS policies applied.
// CI integration is follow-up: a workflow that spins up Postgres,
// runs `prisma migrate deploy`, applies `001_rls_policies.sql`, then
// `vitest run --project rls`.

import { describe, it, beforeAll, afterAll, expect } from "vitest";
import { PrismaClient } from "@prisma/client";

const TEST_URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!TEST_URL)("RLS tenant isolation", () => {
  let prisma: PrismaClient;
  const TENANT_A = "00000000-0000-0000-0000-00000000000a";
  const TENANT_B = "00000000-0000-0000-0000-00000000000b";

  beforeAll(async () => {
    prisma = new PrismaClient({ datasources: { db: { url: TEST_URL } } });

    // Seed two tenants and one client each, bypassing RLS with the
    // admin connection (tests run as the DB owner).
    await prisma.$executeRawUnsafe(`
      INSERT INTO tenants (id, name, slug)
      VALUES ('${TENANT_A}', 'Test A', 'test-a')
      ON CONFLICT (id) DO NOTHING;
    `);
    await prisma.$executeRawUnsafe(`
      INSERT INTO tenants (id, name, slug)
      VALUES ('${TENANT_B}', 'Test B', 'test-b')
      ON CONFLICT (id) DO NOTHING;
    `);
    await prisma.$executeRawUnsafe(`
      INSERT INTO clients (id, "tenantId", name, phone)
      VALUES ('00000000-0000-0000-0000-00000000aaaa', '${TENANT_A}', 'Alice A', '+5511000000001')
      ON CONFLICT (id) DO NOTHING;
    `);
    await prisma.$executeRawUnsafe(`
      INSERT INTO clients (id, "tenantId", name, phone)
      VALUES ('00000000-0000-0000-0000-00000000bbbb', '${TENANT_B}', 'Bob B', '+5511000000002')
      ON CONFLICT (id) DO NOTHING;
    `);
  });

  afterAll(async () => {
    // Cleanup — admin connection ignores RLS.
    await prisma.$executeRawUnsafe(`
      DELETE FROM clients
      WHERE id IN (
        '00000000-0000-0000-0000-00000000aaaa',
        '00000000-0000-0000-0000-00000000bbbb'
      );
    `);
    await prisma.$executeRawUnsafe(`
      DELETE FROM tenants WHERE id IN ('${TENANT_A}', '${TENANT_B}');
    `);
    await prisma.$disconnect();
  });

  it("caller set to tenant A only sees tenant A's clients", async () => {
    await prisma.$executeRawUnsafe(`SET app.current_tenant_id = '${TENANT_A}'`);
    const rows = await prisma.$queryRaw<
      Array<{ id: string; tenantId: string }>
    >`
      SELECT id, "tenantId" FROM clients
    `;
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.tenantId).toBe(TENANT_A);
    }
  });

  it("caller set to tenant B cannot see tenant A rows", async () => {
    await prisma.$executeRawUnsafe(`SET app.current_tenant_id = '${TENANT_B}'`);
    const rows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM clients WHERE id = '00000000-0000-0000-0000-00000000aaaa'
    `;
    expect(rows).toHaveLength(0);
  });

  it("no tenant set (setting = empty) returns no rows", async () => {
    await prisma.$executeRawUnsafe(`RESET app.current_tenant_id`);
    const rows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM clients
    `;
    // With RLS policy referencing an unset GUC, the cast to uuid
    // fails and the policy filters everything out.
    expect(rows).toHaveLength(0);
  });
});
