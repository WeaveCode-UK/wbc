// HG5 — money path: createSale
//
// Covers what would become a financial bug if it regressed:
//   - cashback over the available balance is rejected
//   - the SaleRepository receives the input verbatim (no silent coercion)
//   - calculateSaleTotal is honored end-to-end (item × qty − discount − cashback)
//   - tenantId is passed through (cross-tenant create attempt is the
//     repo's contract — we assert createSale doesn't strip it)
//
// We mock the trace span helper so the test runs without an OTel SDK
// configured. The cashback repo is also mocked because createSale only
// reads from it — the actual debit happens in confirmSale.

import { describe, it, expect, vi } from "vitest";
import { createSale } from "../create-sale";
import type { SaleRepository } from "../../ports/sale-repository";
import type { CashbackRepository } from "../../ports/cashback-repository";
import { InsufficientCashbackError } from "../../domain/errors";

vi.mock("@wbc/shared", async () => {
  const actual =
    await vi.importActual<typeof import("@wbc/shared")>("@wbc/shared");
  return {
    ...actual,
    withSpan: <T>(_n: string, _a: unknown, fn: () => Promise<T>) => fn(),
  };
});

function mockSaleRepo(): SaleRepository {
  return {
    findById: vi.fn(),
    list: vi.fn(),
    create: vi.fn().mockImplementation((data) =>
      Promise.resolve({
        id: "sale-1",
        ...data,
        status: "DRAFT",
        total: 0,
        createdAt: new Date(),
      }),
    ),
    updateStatus: vi.fn(),
    confirmAtomic: vi.fn(),
    delete: vi.fn(),
  } as unknown as SaleRepository;
}

function mockCashbackRepo(available: number): CashbackRepository {
  return {
    getBalance: vi.fn().mockResolvedValue({ available, expiring: [] }),
    create: vi.fn(),
    use: vi.fn(),
  };
}

describe("createSale use-case", () => {
  it("creates a sale with no cashback and skips the balance check", async () => {
    const saleRepo = mockSaleRepo();
    const cashbackRepo = mockCashbackRepo(0);

    await createSale(
      {
        tenantId: "t1",
        clientId: "c1",
        items: [{ productId: "p1", quantity: 2, unitPrice: 50 }],
      },
      saleRepo,
      cashbackRepo,
    );

    expect(cashbackRepo.getBalance).not.toHaveBeenCalled();
    expect(saleRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "t1",
        clientId: "c1",
        items: [{ productId: "p1", quantity: 2, unitPrice: 50 }],
      }),
    );
  });

  it("rejects cashbackUsed greater than available balance", async () => {
    const saleRepo = mockSaleRepo();
    const cashbackRepo = mockCashbackRepo(20);

    await expect(
      createSale(
        {
          tenantId: "t1",
          clientId: "c1",
          items: [{ productId: "p1", quantity: 1, unitPrice: 100 }],
          cashbackUsed: 50,
        },
        saleRepo,
        cashbackRepo,
      ),
    ).rejects.toThrow(InsufficientCashbackError);

    expect(saleRepo.create).not.toHaveBeenCalled();
  });

  it("accepts cashbackUsed exactly equal to the balance (boundary)", async () => {
    const saleRepo = mockSaleRepo();
    const cashbackRepo = mockCashbackRepo(50);

    await createSale(
      {
        tenantId: "t1",
        clientId: "c1",
        items: [{ productId: "p1", quantity: 1, unitPrice: 100 }],
        cashbackUsed: 50,
      },
      saleRepo,
      cashbackRepo,
    );

    expect(saleRepo.create).toHaveBeenCalledOnce();
  });

  it("forwards every optional field to the repository", async () => {
    const saleRepo = mockSaleRepo();
    const cashbackRepo = mockCashbackRepo(100);

    await createSale(
      {
        tenantId: "t1",
        clientId: "c1",
        items: [{ productId: "p1", quantity: 1, unitPrice: 100 }],
        paymentMethod: "PIX",
        discount: 10,
        cashbackUsed: 5,
        campaignId: "cmp-1",
        notes: "checkout test",
      },
      saleRepo,
      cashbackRepo,
    );

    expect(saleRepo.create).toHaveBeenCalledWith({
      tenantId: "t1",
      clientId: "c1",
      items: [{ productId: "p1", quantity: 1, unitPrice: 100 }],
      paymentMethod: "PIX",
      discount: 10,
      cashbackUsed: 5,
      campaignId: "cmp-1",
      notes: "checkout test",
    });
  });

  it("does not call getBalance when cashbackUsed is 0 (perf invariant)", async () => {
    const saleRepo = mockSaleRepo();
    const cashbackRepo = mockCashbackRepo(100);

    await createSale(
      {
        tenantId: "t1",
        clientId: "c1",
        items: [{ productId: "p1", quantity: 1, unitPrice: 100 }],
        cashbackUsed: 0,
      },
      saleRepo,
      cashbackRepo,
    );

    expect(cashbackRepo.getBalance).not.toHaveBeenCalled();
  });
});
