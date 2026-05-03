// T-coverage — resetDemoTenant + listDemoTenants + setDemoMode
//
// Demo tenants get their transactional data wiped on schedule. Critical
// guards:
//   - resetDemoTenant refuses to run on a non-demo tenant — without
//     this guard, a misfired call could nuke a real tenant's data.
//   - the wipe runs inside a transaction so partial failure rolls back.
//   - listDemoTenants only returns tenants flagged isDemo=true AND
//     isActive=true (paused/cancelled demos are excluded).
//   - setDemoMode(true) flips isDemo and stamps demoResetAt; (false)
//     clears demoResetAt to detach from the daily cron.
import { describe, it, expect, vi, beforeEach } from "vitest";

const { findUniqueTenant, updateTenant, findManyTenant, txMock, delManyMocks } =
  vi.hoisted(() => {
    const delManyMocks = {
      loyaltyTransaction: vi.fn().mockResolvedValue({ count: 0 }),
      loyaltyPoints: vi.fn().mockResolvedValue({ count: 0 }),
      cashbackRedemption: vi.fn().mockResolvedValue({ count: 0 }),
      cashback: vi.fn().mockResolvedValue({ count: 0 }),
      delivery: vi.fn().mockResolvedValue({ count: 0 }),
      payment: vi.fn().mockResolvedValue({ count: 0 }),
      saleItem: vi.fn().mockResolvedValue({ count: 0 }),
      sale: vi.fn().mockResolvedValue({ count: 0 }),
      expense: vi.fn().mockResolvedValue({ count: 0 }),
      scheduledMessage: vi.fn().mockResolvedValue({ count: 0 }),
      campaign: vi.fn().mockResolvedValue({ count: 0 }),
      appointment: vi.fn().mockResolvedValue({ count: 0 }),
      reminder: vi.fn().mockResolvedValue({ count: 0 }),
      opportunity: vi.fn().mockResolvedValue({ count: 0 }),
      aIGeneration: vi.fn().mockResolvedValue({ count: 0 }),
      notification: vi.fn().mockResolvedValue({ count: 0 }),
      giftSuggestor: vi.fn().mockResolvedValue({ count: 0 }),
      clientWishlist: vi.fn().mockResolvedValue({ count: 0 }),
      clientTag: vi.fn().mockResolvedValue({ count: 0 }),
      tag: vi.fn().mockResolvedValue({ count: 0 }),
      client: vi.fn().mockResolvedValue({ count: 0 }),
      stock: vi.fn().mockResolvedValue({ count: 0 }),
      brandOrder: vi.fn().mockResolvedValue({ count: 0 }),
      sample: vi.fn().mockResolvedValue({ count: 0 }),
      product: vi.fn().mockResolvedValue({ count: 0 }),
    };
    const tenantUpdateInTx = vi.fn().mockResolvedValue(undefined);
    const tx = {
      loyaltyTransaction: { deleteMany: delManyMocks.loyaltyTransaction },
      loyaltyPoints: { deleteMany: delManyMocks.loyaltyPoints },
      cashbackRedemption: { deleteMany: delManyMocks.cashbackRedemption },
      cashback: { deleteMany: delManyMocks.cashback },
      delivery: { deleteMany: delManyMocks.delivery },
      payment: { deleteMany: delManyMocks.payment },
      saleItem: { deleteMany: delManyMocks.saleItem },
      sale: { deleteMany: delManyMocks.sale },
      expense: { deleteMany: delManyMocks.expense },
      scheduledMessage: { deleteMany: delManyMocks.scheduledMessage },
      campaign: { deleteMany: delManyMocks.campaign },
      appointment: { deleteMany: delManyMocks.appointment },
      reminder: { deleteMany: delManyMocks.reminder },
      opportunity: { deleteMany: delManyMocks.opportunity },
      aIGeneration: { deleteMany: delManyMocks.aIGeneration },
      notification: { deleteMany: delManyMocks.notification },
      giftSuggestor: { deleteMany: delManyMocks.giftSuggestor },
      clientWishlist: { deleteMany: delManyMocks.clientWishlist },
      clientTag: { deleteMany: delManyMocks.clientTag },
      tag: { deleteMany: delManyMocks.tag },
      client: { deleteMany: delManyMocks.client },
      stock: { deleteMany: delManyMocks.stock },
      brandOrder: { deleteMany: delManyMocks.brandOrder },
      sample: { deleteMany: delManyMocks.sample },
      product: { deleteMany: delManyMocks.product },
      tenant: { update: tenantUpdateInTx },
    };
    // The transaction handler receives a tx-shaped client; we hand back the
    // same `tx` object literal we built above so each delete-many recorder
    // fires through the hoisted mocks.
    const txMock = vi
      .fn()
      .mockImplementation(async (cb: (txArg: unknown) => Promise<unknown>) =>
        cb(tx),
      );
    return {
      findUniqueTenant: vi.fn(),
      updateTenant: vi.fn().mockResolvedValue(undefined),
      findManyTenant: vi.fn().mockResolvedValue([]),
      txMock,
      delManyMocks: { ...delManyMocks, tenantUpdateInTx },
    };
  });

vi.mock("@wbc/db", () => ({
  prisma: {
    tenant: {
      findUnique: findUniqueTenant,
      findMany: findManyTenant,
      update: updateTenant,
    },
    $transaction: txMock,
  },
}));

import { resetDemoTenant, listDemoTenants, setDemoMode } from "../demo-mode";

beforeEach(() => {
  findUniqueTenant.mockReset();
  updateTenant.mockClear();
  findManyTenant.mockReset();
  txMock.mockClear();
  for (const fn of Object.values(delManyMocks)) {
    (fn as ReturnType<typeof vi.fn>).mockClear();
  }
});

describe("resetDemoTenant", () => {
  it("refuses to run on a non-demo tenant — guards real tenants", async () => {
    findUniqueTenant.mockResolvedValue({ id: "t1", isDemo: false });
    await expect(resetDemoTenant("t1")).rejects.toThrow(/not flagged as demo/);
    expect(txMock).not.toHaveBeenCalled();
  });

  it("refuses when the tenant doesn't exist (no row → no isDemo flag)", async () => {
    findUniqueTenant.mockResolvedValue(null);
    await expect(resetDemoTenant("ghost")).rejects.toThrow(
      /not flagged as demo/,
    );
  });

  it("runs the wipe inside a single $transaction when isDemo=true", async () => {
    findUniqueTenant.mockResolvedValue({ id: "t1", isDemo: true });
    await resetDemoTenant("t1");
    expect(txMock).toHaveBeenCalledOnce();
    // Sanity: a few of the delete-many calls fired with the tenant
    // filter (we don't enumerate all 25 — that would be brittle).
    expect(delManyMocks.client).toHaveBeenCalledWith({
      where: { tenantId: "t1" },
    });
    expect(delManyMocks.product).toHaveBeenCalledWith({
      where: { tenantId: "t1" },
    });
    // Sale-children scope through the parent sale relation (the sale
    // table itself is tenant-scoped).
    expect(delManyMocks.payment).toHaveBeenCalledWith({
      where: { sale: { tenantId: "t1" } },
    });
  });

  it("stamps demoResetAt on the tenant after the wipe", async () => {
    findUniqueTenant.mockResolvedValue({ id: "t1", isDemo: true });
    await resetDemoTenant("t1");
    expect(delManyMocks.tenantUpdateInTx).toHaveBeenCalledWith({
      where: { id: "t1" },
      data: { demoResetAt: expect.any(Date) },
    });
  });
});

describe("listDemoTenants", () => {
  it("only returns tenants where isDemo=true AND isActive=true", async () => {
    findManyTenant.mockResolvedValue([{ id: "t1" }, { id: "t2" }]);
    const out = await listDemoTenants();
    expect(findManyTenant).toHaveBeenCalledWith({
      where: { isDemo: true, isActive: true },
      select: { id: true },
    });
    expect(out).toEqual(["t1", "t2"]);
  });
});

describe("setDemoMode", () => {
  it("enabling stamps demoResetAt (so cron knows it just turned on)", async () => {
    await setDemoMode("t1", true);
    expect(updateTenant).toHaveBeenCalledWith({
      where: { id: "t1" },
      data: {
        isDemo: true,
        demoResetAt: expect.any(Date),
      },
    });
  });

  it("disabling clears demoResetAt to detach from the daily cron", async () => {
    await setDemoMode("t1", false);
    expect(updateTenant).toHaveBeenCalledWith({
      where: { id: "t1" },
      data: {
        isDemo: false,
        demoResetAt: null,
      },
    });
  });
});
