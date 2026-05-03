// T2.5 — flagExpiringCashbacks
//
// Aggregation invariants we lock in:
//   - one notification per client even if they have N expiring cashbacks
//   - already-notified-recently clients are skipped (renotify cutoff = 7d)
//   - cashbacks fully consumed (remaining ≤ 0) are filtered before
//     aggregation
//   - earliest expiry wins when aggregating multiple rows for one client
//
// Prisma is module-mocked because the use-case uses the global client
// directly. The notification-fanout dep is also mocked — we only care
// that it gets called with the right (tenantId, type, body) shape.
import { describe, it, expect, vi, beforeEach } from "vitest";

const { findManyCashback, findFirstNotification, createPushable } = vi.hoisted(
  () => ({
    findManyCashback: vi.fn(),
    findFirstNotification: vi.fn(),
    createPushable: vi.fn().mockResolvedValue(undefined),
  }),
);

vi.mock("@wbc/db", () => ({
  prisma: {
    cashback: { findMany: findManyCashback },
    notification: { findFirst: findFirstNotification },
  },
}));

vi.mock("@wbc/business/schedule/use-cases/notification-fanout", () => ({
  createPushableNotification: createPushable,
}));

import { flagExpiringCashbacks } from "../flag-expiring-cashback";

function row(opts: {
  clientId: string;
  amount: number;
  used?: number;
  expiresAt?: Date;
  name?: string;
}) {
  return {
    id: `cb-${Math.random().toString(36).slice(2, 8)}`,
    clientId: opts.clientId,
    amount: opts.amount,
    usedAmount: opts.used ?? 0,
    expiresAt: opts.expiresAt ?? new Date("2026-05-08T00:00:00Z"),
    client: { name: opts.name ?? "Maria" },
  };
}

beforeEach(() => {
  findManyCashback.mockReset();
  findFirstNotification.mockReset();
  createPushable.mockClear();
  findFirstNotification.mockResolvedValue(null);
});

describe("flagExpiringCashbacks", () => {
  it("flags one notification per client even with multiple cashback rows", async () => {
    findManyCashback.mockResolvedValue([
      row({ clientId: "c1", amount: 30, name: "Maria" }),
      row({ clientId: "c1", amount: 20, name: "Maria" }),
      row({ clientId: "c1", amount: 10, name: "Maria" }),
    ]);

    const r = await flagExpiringCashbacks("t1");
    expect(r.flagged).toBe(1);
    expect(createPushable).toHaveBeenCalledTimes(1);
    // Aggregated amount appears formatted in the title.
    const call = createPushable.mock.calls[0]![0];
    expect(call.title).toContain("R$");
  });

  it("skips clients already notified within the renotify window", async () => {
    findManyCashback.mockResolvedValue([row({ clientId: "c1", amount: 50 })]);
    // Recent notification exists — should be skipped.
    findFirstNotification.mockResolvedValue({ id: "notif-prev" });

    const r = await flagExpiringCashbacks("t1");
    expect(r.flagged).toBe(0);
    expect(r.skipped).toBe(1);
    expect(createPushable).not.toHaveBeenCalled();
  });

  it("filters out cashbacks fully consumed (remaining ≤ 0) before aggregating", async () => {
    findManyCashback.mockResolvedValue([
      row({ clientId: "c1", amount: 40, used: 40 }), // remaining 0 — drop
      row({ clientId: "c1", amount: 10, used: 0 }), // remaining 10 — keep
    ]);

    await flagExpiringCashbacks("t1");
    expect(createPushable).toHaveBeenCalledTimes(1);
    expect(createPushable.mock.calls[0]![0].title).toContain("10");
  });

  it("keeps the earliest expiry when aggregating per client", async () => {
    findManyCashback.mockResolvedValue([
      row({
        clientId: "c1",
        amount: 10,
        expiresAt: new Date("2026-05-10"),
      }),
      row({
        clientId: "c1",
        amount: 10,
        expiresAt: new Date("2026-05-08"),
      }),
    ]);

    await flagExpiringCashbacks("t1");
    const body = createPushable.mock.calls[0]![0].body as string;
    expect(body).toContain("2026-05-08");
  });

  it("returns scanned/flagged/skipped counts truthfully", async () => {
    findManyCashback.mockResolvedValue([
      row({ clientId: "c1", amount: 30 }),
      row({ clientId: "c2", amount: 20 }),
    ]);
    findFirstNotification.mockResolvedValueOnce(null); // c1 — flag
    findFirstNotification.mockResolvedValueOnce({ id: "n" }); // c2 — skip

    const r = await flagExpiringCashbacks("t1");
    expect(r).toEqual({ scanned: 2, flagged: 1, skipped: 1 });
  });

  it("scopes findMany by tenantId (no cross-tenant scan)", async () => {
    findManyCashback.mockResolvedValue([]);
    await flagExpiringCashbacks("tenant-X");
    expect(findManyCashback).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: "tenant-X" }),
      }),
    );
  });
});
