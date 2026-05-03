// T2.23 — buildRestockReminders
//
// Per-client restock cron. The use-case talks to Prisma directly (no
// port), so we hoist mocks for `client.findMany`, `sale.findMany`,
// `reminder.findFirst` and `reminder.create`. Invariants we lock in:
//   - inactive clients (isActive=false) and leads (isLead=true) are
//     excluded by the where clause — never reach the inner loop.
//   - tenantId scopes EVERY query (no cross-tenant scan).
//   - clients with 0 sales are skipped (counted in `skipped`, never
//     reach the create call).
//   - mean inter-purchase days drives the trigger date — for a client
//     buying every 30 days, lastPurchase + 30d is the trigger.
//   - rerunning the same day is a no-op (`reminder.findFirst` returns
//     a row → skipped).

import { describe, it, expect, vi, beforeEach } from "vitest";

const { findManyClient, findManySale, findFirstReminder, createReminder } =
  vi.hoisted(() => ({
    findManyClient: vi.fn(),
    findManySale: vi.fn(),
    findFirstReminder: vi.fn(),
    createReminder: vi.fn().mockResolvedValue({ id: "r-new" }),
  }));

vi.mock("@wbc/db", () => ({
  prisma: {
    client: { findMany: findManyClient },
    sale: { findMany: findManySale },
    reminder: { findFirst: findFirstReminder, create: createReminder },
  },
}));

import { buildRestockReminders } from "../build-restock-reminders";

beforeEach(() => {
  findManyClient.mockReset();
  findManySale.mockReset();
  findFirstReminder.mockReset();
  createReminder.mockClear();
  findFirstReminder.mockResolvedValue(null);
});

const DAY_MS = 24 * 60 * 60 * 1000;

describe("buildRestockReminders", () => {
  it("scopes every Prisma query to the tenantId (no cross-tenant scan)", async () => {
    findManyClient.mockResolvedValue([]);
    await buildRestockReminders("tenant-X");
    expect(findManyClient).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: "tenant-X" }),
      }),
    );
  });

  it("excludes inactive clients and leads in the where clause", async () => {
    findManyClient.mockResolvedValue([]);
    await buildRestockReminders("t1");
    const where = findManyClient.mock.calls[0]?.[0].where;
    expect(where.isActive).toBe(true);
    expect(where.isLead).toBe(false);
  });

  it("skips clients with zero sales (no reminder created)", async () => {
    findManyClient.mockResolvedValue([{ id: "c-empty" }]);
    findManySale.mockResolvedValue([]);

    const r = await buildRestockReminders("t1");
    expect(r.scanned).toBe(1);
    expect(r.created).toBe(0);
    expect(r.skipped).toBe(1);
    expect(createReminder).not.toHaveBeenCalled();
  });

  it("creates a reminder when today >= lastPurchase + meanCycle", async () => {
    // Three sales 30 days apart, oldest first becomes most recent on
    // desc sort. Last purchase 31 days ago → past the trigger of
    // last + 30d.
    const now = Date.now();
    findManyClient.mockResolvedValue([{ id: "c1" }]);
    findManySale.mockResolvedValue([
      { createdAt: new Date(now - 31 * DAY_MS) }, // most recent
      { createdAt: new Date(now - 61 * DAY_MS) },
      { createdAt: new Date(now - 91 * DAY_MS) },
    ]);

    const r = await buildRestockReminders("t1");
    expect(r.created).toBe(1);
    expect(createReminder).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: "t1",
          clientId: "c1",
          type: "RESTOCK",
        }),
      }),
    );
  });

  it("skips when the trigger day is still in the future", async () => {
    // Last purchase 5 days ago, mean cycle 30d → trigger in ~25d.
    const now = Date.now();
    findManyClient.mockResolvedValue([{ id: "c1" }]);
    findManySale.mockResolvedValue([
      { createdAt: new Date(now - 5 * DAY_MS) },
      { createdAt: new Date(now - 35 * DAY_MS) },
    ]);

    const r = await buildRestockReminders("t1");
    expect(r.created).toBe(0);
    expect(r.skipped).toBe(1);
    expect(createReminder).not.toHaveBeenCalled();
  });

  it("uses 60-day fallback cycle when client has only one sale", async () => {
    // One sale 61 days ago → past the 60d fallback trigger.
    const now = Date.now();
    findManyClient.mockResolvedValue([{ id: "c1" }]);
    findManySale.mockResolvedValue([
      { createdAt: new Date(now - 61 * DAY_MS) },
    ]);

    const r = await buildRestockReminders("t1");
    expect(r.created).toBe(1);
    const msg = createReminder.mock.calls[0]?.[0].data.message as string;
    // Why: the 60d fallback should appear in the user-facing message.
    expect(msg).toContain("60");
  });

  it("rerunning the same day is a no-op (idempotency)", async () => {
    const now = Date.now();
    findManyClient.mockResolvedValue([{ id: "c1" }]);
    findManySale.mockResolvedValue([
      { createdAt: new Date(now - 31 * DAY_MS) },
      { createdAt: new Date(now - 61 * DAY_MS) },
    ]);
    // PENDING reminder for today already exists.
    findFirstReminder.mockResolvedValue({ id: "r-existing" });

    const r = await buildRestockReminders("t1");
    expect(r.created).toBe(0);
    expect(r.skipped).toBe(1);
    expect(createReminder).not.toHaveBeenCalled();
  });

  it("queries sales scoped to (tenantId, clientId) only", async () => {
    findManyClient.mockResolvedValue([{ id: "c1" }]);
    findManySale.mockResolvedValue([]);
    await buildRestockReminders("tenant-X");
    expect(findManySale).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: "tenant-X", clientId: "c1" },
      }),
    );
  });
});
