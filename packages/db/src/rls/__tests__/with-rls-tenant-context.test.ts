// Coverage gap: with-rls-tenant-context is the runtime activator for
// the row-level security policies declared in
// `migrations/manual/001_rls_policies.sql`. The integration test in T5.2
// proves the policies actually filter; this unit test proves the
// wrapper:
//   - rejects non-UUID tenantIds before any SQL executes (the SET LOCAL
//     value is interpolated raw — defence in depth against injection)
//   - opens a $transaction and runs `SET LOCAL app.current_tenant_id`
//     once before delegating to the caller block
//   - returns the caller's value verbatim
//
// We pass an explicit `client` argument so we don't have to mock
// `../index` (the singleton); the third arg lets us inject a fake.

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Prisma, PrismaClient } from "@prisma/client";
import { withRlsTenantContext } from "../with-rls-tenant-context";

const VALID_UUID = "11111111-2222-3333-4444-555555555555";

interface FakeTx {
  $executeRawUnsafe: ReturnType<typeof vi.fn>;
}

let executeRawUnsafe: FakeTx["$executeRawUnsafe"];
let transactionFn: ReturnType<typeof vi.fn>;
let fakeClient: PrismaClient;

beforeEach(() => {
  executeRawUnsafe = vi.fn().mockResolvedValue(undefined);
  // Build the fake $transaction so it invokes the caller's block with
  // a tx that exposes only $executeRawUnsafe (the rest of Prisma is
  // not used by the wrapper itself — caller blocks supply their own
  // expectations through the test).
  transactionFn = vi.fn(async (cb: (tx: FakeTx) => Promise<unknown>) => {
    return cb({ $executeRawUnsafe: executeRawUnsafe });
  });
  fakeClient = {
    $transaction: transactionFn,
  } as unknown as PrismaClient;
});

describe("withRlsTenantContext — UUID guard", () => {
  it.each([
    ["empty string", ""],
    ["plain alnum", "tenant1"],
    ["semicolon (SQL injection attempt)", "abc'; DROP TABLE x; --"],
    ["UUID with extra trailing chars", `${VALID_UUID}xx`],
    ["UUID-like but wrong segment lengths", "1234-5678-9012-3456-7890"],
  ])("throws on non-UUID tenantId — %s", async (_label, badId) => {
    await expect(
      withRlsTenantContext(
        badId,
        async (tx: Prisma.TransactionClient) => {
          // Block must NOT run.
          void tx;
          return "should-not-reach";
        },
        fakeClient,
      ),
    ).rejects.toThrow(/withRlsTenantContext: tenantId must be a UUID/);
    expect(transactionFn).not.toHaveBeenCalled();
    expect(executeRawUnsafe).not.toHaveBeenCalled();
  });

  it("accepts a well-formed v4 UUID and runs the SET LOCAL before the block", async () => {
    let blockSawSetLocal = false;
    await withRlsTenantContext(
      VALID_UUID,
      async () => {
        // The wrapper calls $executeRawUnsafe before our block, so by
        // the time we run, the spy has been invoked exactly once.
        blockSawSetLocal = executeRawUnsafe.mock.calls.length === 1;
        return null;
      },
      fakeClient,
    );

    expect(blockSawSetLocal).toBe(true);
  });

  it("accepts uppercase-hex UUID variants (case-insensitive guard)", async () => {
    const upper = VALID_UUID.toUpperCase();
    await expect(
      withRlsTenantContext(upper, async () => "ok", fakeClient),
    ).resolves.toBe("ok");
  });
});

describe("withRlsTenantContext — SET LOCAL", () => {
  it("issues `SET LOCAL app.current_tenant_id = '<uuid>'` exactly once", async () => {
    await withRlsTenantContext(VALID_UUID, async () => undefined, fakeClient);

    expect(executeRawUnsafe).toHaveBeenCalledOnce();
    const sql = executeRawUnsafe.mock.calls[0]![0] as string;
    expect(sql).toBe(`SET LOCAL app.current_tenant_id = '${VALID_UUID}'`);
  });

  it("returns the value the caller block resolves to", async () => {
    const result = await withRlsTenantContext(
      VALID_UUID,
      async () => ({ rows: 7 }),
      fakeClient,
    );
    expect(result).toEqual({ rows: 7 });
  });

  it("propagates errors thrown inside the block (rollback path)", async () => {
    await expect(
      withRlsTenantContext(
        VALID_UUID,
        async () => {
          throw new Error("query failed");
        },
        fakeClient,
      ),
    ).rejects.toThrow("query failed");
    // SET LOCAL still ran before the failure — important for the auditor:
    // a tx that ran SET LOCAL but failed downstream still rolled back
    // the setting because of the LOCAL scope.
    expect(executeRawUnsafe).toHaveBeenCalledOnce();
  });
});
