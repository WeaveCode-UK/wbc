// HG5 — money path: confirmSale
//
// confirmSale is the moment money is acknowledged: status → CONFIRMED,
// cashback issued, cashback debited (if used at checkout), stock
// decremented, outbox event emitted — atomically. The contract is held
// by SaleRepository.confirmAtomic; this test asserts confirmSale builds
// the right ConfirmAtomicParams. If any of the asserts here flip
// without an explicit business reason, it's a financial regression.
//
// What we explicitly test:
//   - DRAFT → CONFIRMED is the only legal transition
//   - cashback issued only when calculateCashback(total) > 0
//     (today: 5% of total ≥ 0; floor matters because R$ 0,01 cashback is noise)
//   - cashback debit fires only when sale.cashbackUsed > 0 (no phantom debits)
//   - stock decrements include every item with original quantity
//   - SALE_CONFIRMED event payload preserves saleId / clientId / total / items
//   - tenant scoping: a sale belonging to tenant A can never be confirmed
//     under tenant B (findById returns null → SaleNotFoundError)

import { describe, it, expect, vi } from "vitest";
import { confirmSale } from "../confirm-sale";
import type { SaleRepository } from "../../ports/sale-repository";
import type { CashbackRepository } from "../../ports/cashback-repository";
import { SaleNotFoundError, InvalidSaleStatusError } from "../../domain/errors";

vi.mock("@wbc/shared", async () => {
  const actual =
    await vi.importActual<typeof import("@wbc/shared")>("@wbc/shared");
  return {
    ...actual,
    EVENTS: { SALE_CONFIRMED: "SALE_CONFIRMED" },
  };
});

interface FakeSale {
  id: string;
  tenantId: string;
  status: string;
  clientId: string;
  total: number;
  cashbackUsed: number;
  items: Array<{ productId: string; quantity: number }>;
}

function mockSaleRepo(sale: FakeSale | null): SaleRepository {
  return {
    findById: vi.fn().mockResolvedValue(sale),
    list: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn(),
    confirmAtomic: vi
      .fn()
      .mockImplementation((params) =>
        Promise.resolve({ id: params.saleId, status: "CONFIRMED" }),
      ),
    delete: vi.fn(),
  } as unknown as SaleRepository;
}

const noopCashback: CashbackRepository = {
  getBalance: vi.fn(),
  create: vi.fn(),
  use: vi.fn(),
};

describe("confirmSale use-case", () => {
  it("rejects when the sale doesn't exist (cross-tenant attempt also lands here)", async () => {
    const repo = mockSaleRepo(null);
    await expect(
      confirmSale("t1", "missing", repo, noopCashback),
    ).rejects.toThrow(SaleNotFoundError);
    expect(repo.confirmAtomic).not.toHaveBeenCalled();
  });

  it("rejects when the sale is already CONFIRMED", async () => {
    const repo = mockSaleRepo({
      id: "s1",
      tenantId: "t1",
      status: "CONFIRMED",
      clientId: "c1",
      total: 100,
      cashbackUsed: 0,
      items: [{ productId: "p1", quantity: 1 }],
    });
    await expect(confirmSale("t1", "s1", repo, noopCashback)).rejects.toThrow(
      InvalidSaleStatusError,
    );
    expect(repo.confirmAtomic).not.toHaveBeenCalled();
  });

  it("rejects when the sale is CANCELLED", async () => {
    const repo = mockSaleRepo({
      id: "s1",
      tenantId: "t1",
      status: "CANCELLED",
      clientId: "c1",
      total: 100,
      cashbackUsed: 0,
      items: [{ productId: "p1", quantity: 1 }],
    });
    await expect(confirmSale("t1", "s1", repo, noopCashback)).rejects.toThrow(
      InvalidSaleStatusError,
    );
  });

  it("issues cashback proportional to total when total > 0", async () => {
    const repo = mockSaleRepo({
      id: "s1",
      tenantId: "t1",
      status: "DRAFT",
      clientId: "c1",
      total: 200,
      cashbackUsed: 0,
      items: [{ productId: "p1", quantity: 2, unitPrice: 100 } as never],
    });

    await confirmSale("t1", "s1", repo, noopCashback);

    const call = (repo.confirmAtomic as ReturnType<typeof vi.fn>).mock
      .calls[0]?.[0];
    expect(call.cashback).toBeDefined();
    expect(call.cashback.clientId).toBe("c1");
    expect(call.cashback.amount).toBeGreaterThan(0);
    expect(call.cashback.originSaleId).toBe("s1");
    expect(call.cashback.expiresAt).toBeInstanceOf(Date);
  });

  it("does NOT debit cashback when sale.cashbackUsed is zero", async () => {
    const repo = mockSaleRepo({
      id: "s1",
      tenantId: "t1",
      status: "DRAFT",
      clientId: "c1",
      total: 100,
      cashbackUsed: 0,
      items: [{ productId: "p1", quantity: 1 }],
    });

    await confirmSale("t1", "s1", repo, noopCashback);

    const call = (repo.confirmAtomic as ReturnType<typeof vi.fn>).mock
      .calls[0]?.[0];
    expect(call.cashbackDebit).toBeUndefined();
  });

  it("debits cashback when sale.cashbackUsed > 0 (idempotency keyed by saleId)", async () => {
    const repo = mockSaleRepo({
      id: "s1",
      tenantId: "t1",
      status: "DRAFT",
      clientId: "c1",
      total: 100,
      cashbackUsed: 25,
      items: [{ productId: "p1", quantity: 1 }],
    });

    await confirmSale("t1", "s1", repo, noopCashback);

    const call = (repo.confirmAtomic as ReturnType<typeof vi.fn>).mock
      .calls[0]?.[0];
    expect(call.cashbackDebit).toEqual({ clientId: "c1", amount: 25 });
    // saleId is the idempotency anchor for the atomic confirm — assert it
    // is passed so a retried confirm can't double-debit.
    expect(call.saleId).toBe("s1");
  });

  it("sends every item to stock decrements with original quantity", async () => {
    const repo = mockSaleRepo({
      id: "s1",
      tenantId: "t1",
      status: "DRAFT",
      clientId: "c1",
      total: 300,
      cashbackUsed: 0,
      items: [
        { productId: "p1", quantity: 2 },
        { productId: "p2", quantity: 5 },
        { productId: "p3", quantity: 1 },
      ],
    });

    await confirmSale("t1", "s1", repo, noopCashback);

    const call = (repo.confirmAtomic as ReturnType<typeof vi.fn>).mock
      .calls[0]?.[0];
    expect(call.stockDecrements).toEqual([
      { productId: "p1", quantity: 2 },
      { productId: "p2", quantity: 5 },
      { productId: "p3", quantity: 1 },
    ]);
  });

  it("emits SALE_CONFIRMED event with full payload", async () => {
    const repo = mockSaleRepo({
      id: "s1",
      tenantId: "t1",
      status: "DRAFT",
      clientId: "c1",
      total: 150,
      cashbackUsed: 0,
      items: [{ productId: "p1", quantity: 3 }],
    });

    await confirmSale("t1", "s1", repo, noopCashback);

    const call = (repo.confirmAtomic as ReturnType<typeof vi.fn>).mock
      .calls[0]?.[0];
    expect(call.eventType).toBe("SALE_CONFIRMED");
    expect(call.eventPayload).toEqual({
      tenantId: "t1",
      saleId: "s1",
      clientId: "c1",
      total: 150,
      items: [{ productId: "p1", quantity: 3 }],
    });
  });
});
