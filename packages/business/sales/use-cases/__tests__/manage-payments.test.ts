// T2.4 — markPaid + listPayments + getAccountsReceivable
//
// Money path: marking a payment paid is the moment Mercado Pago / cash
// flows hit the books. We assert that:
//   - tenantId is forwarded verbatim to the repo (no cross-tenant leak)
//   - the use-case is a thin pass-through (it doesn't recompute amounts
//     or change status outside the repo contract)
//   - listAccountsReceivable forwards filters as-is
import { describe, it, expect, vi } from "vitest";
import {
  markPaid,
  listPayments,
  getAccountsReceivable,
} from "../manage-payments";
import type { PaymentRepository } from "../../ports/payment-repository";

function fakePayment(overrides: Record<string, unknown> = {}) {
  return {
    id: "pay-1",
    saleId: "sale-1",
    tenantId: "t1",
    amount: 100,
    status: "PAID",
    paidAt: new Date("2026-05-01T12:00:00Z"),
    ...overrides,
  };
}

function mockRepo(): PaymentRepository {
  return {
    findBySaleId: vi.fn().mockResolvedValue([fakePayment()]),
    markPaid: vi
      .fn()
      .mockImplementation((_t, id) => Promise.resolve(fakePayment({ id }))),
    listOverdue: vi.fn().mockResolvedValue([]),
    listAccountsReceivable: vi
      .fn()
      .mockResolvedValue({ data: [fakePayment()], totalPending: 0 }),
  } as unknown as PaymentRepository;
}

describe("markPaid use-case", () => {
  it("forwards tenantId + paymentId to the repo unchanged", async () => {
    const repo = mockRepo();
    await markPaid("t1", "pay-42", repo);
    expect(repo.markPaid).toHaveBeenCalledWith("t1", "pay-42");
  });

  it("does not mutate the returned Payment row", async () => {
    const repo = mockRepo();
    const result = await markPaid("t1", "pay-42", repo);
    expect(result.amount).toBe(100);
    expect(result.status).toBe("PAID");
  });

  it("propagates repo errors instead of swallowing them", async () => {
    const repo = mockRepo();
    (repo.markPaid as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("payment_not_found"),
    );
    await expect(markPaid("t1", "ghost", repo)).rejects.toThrow(
      "payment_not_found",
    );
  });
});

describe("listPayments", () => {
  it("scopes by tenantId and saleId", async () => {
    const repo = mockRepo();
    await listPayments("t1", "sale-99", repo);
    expect(repo.findBySaleId).toHaveBeenCalledWith("t1", "sale-99");
  });
});

describe("getAccountsReceivable", () => {
  it("forwards filter object verbatim", async () => {
    const repo = mockRepo();
    await getAccountsReceivable("t1", { status: "PENDING" }, repo);
    expect(repo.listAccountsReceivable).toHaveBeenCalledWith("t1", {
      status: "PENDING",
    });
  });

  it("works with no filters", async () => {
    const repo = mockRepo();
    const out = await getAccountsReceivable("t1", {}, repo);
    expect(out).toHaveProperty("data");
    expect(out).toHaveProperty("totalPending");
  });
});
