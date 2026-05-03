// T-coverage — createReturn (refund flow)
//
// Money path: refunds reverse cash. ACH-024 added two guards:
//   1. only post-confirmation states (CONFIRMED/SEPARATED/SHIPPED/DELIVERED)
//      can be refunded — DRAFT/CANCELLED would mint money out of nothing.
//   2. sum(refunds) must be <= sale.total — without this, the same sale
//      could be refunded an unbounded number of times.
// We also validate refundAmount must be > 0 (a 0/-ve refund is meaningless).
import { describe, it, expect, vi } from "vitest";
import { createReturn } from "../create-return";
import {
  SaleNotFoundError,
  RefundExceedsSaleTotalError,
  SaleNotRefundableError,
  InvalidRefundAmountError,
} from "../../domain/errors";
import type { SaleRepository } from "../../ports/sale-repository";
import type { ReturnRepository } from "../../ports/return-repository";

function saleRepoMock(sale: Record<string, unknown> | null): SaleRepository {
  return {
    findById: vi.fn().mockResolvedValue(sale),
    list: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn(),
    confirmAtomic: vi.fn(),
    delete: vi.fn(),
  } as unknown as SaleRepository;
}

function returnRepoMock(
  overrides: Partial<ReturnRepository> = {},
): ReturnRepository {
  return {
    create: vi.fn().mockImplementation((saleId, reason, amount) =>
      Promise.resolve({
        id: "r1",
        saleId,
        reason,
        refundAmount: amount,
        createdAt: new Date(),
      }),
    ),
    findBySaleId: vi.fn().mockResolvedValue([]),
    listByTenant: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

describe("createReturn use-case", () => {
  it("throws InvalidRefundAmountError when refundAmount is zero", async () => {
    await expect(
      createReturn(
        { tenantId: "t1", saleId: "s1", reason: "broken", refundAmount: 0 },
        saleRepoMock({
          id: "s1",
          tenantId: "t1",
          status: "CONFIRMED",
          total: 100,
        }),
        returnRepoMock(),
      ),
    ).rejects.toThrow(InvalidRefundAmountError);
  });

  it("throws InvalidRefundAmountError when refundAmount is negative", async () => {
    await expect(
      createReturn(
        { tenantId: "t1", saleId: "s1", reason: "x", refundAmount: -5 },
        saleRepoMock({
          id: "s1",
          tenantId: "t1",
          status: "CONFIRMED",
          total: 100,
        }),
        returnRepoMock(),
      ),
    ).rejects.toThrow(InvalidRefundAmountError);
  });

  it("throws SaleNotFoundError when sale doesn't exist", async () => {
    await expect(
      createReturn(
        { tenantId: "t1", saleId: "ghost", reason: "x", refundAmount: 10 },
        saleRepoMock(null),
        returnRepoMock(),
      ),
    ).rejects.toThrow(SaleNotFoundError);
  });

  it("rejects refund against DRAFT sale (no money to reverse)", async () => {
    await expect(
      createReturn(
        { tenantId: "t1", saleId: "s1", reason: "x", refundAmount: 10 },
        saleRepoMock({ id: "s1", tenantId: "t1", status: "DRAFT", total: 100 }),
        returnRepoMock(),
      ),
    ).rejects.toThrow(SaleNotRefundableError);
  });

  it("rejects refund against CANCELLED sale", async () => {
    await expect(
      createReturn(
        { tenantId: "t1", saleId: "s1", reason: "x", refundAmount: 10 },
        saleRepoMock({
          id: "s1",
          tenantId: "t1",
          status: "CANCELLED",
          total: 100,
        }),
        returnRepoMock(),
      ),
    ).rejects.toThrow(SaleNotRefundableError);
  });

  it("creates a refund for a CONFIRMED sale (full amount)", async () => {
    const returnRepo = returnRepoMock();
    const result = await createReturn(
      { tenantId: "t1", saleId: "s1", reason: "broken", refundAmount: 100 },
      saleRepoMock({
        id: "s1",
        tenantId: "t1",
        status: "CONFIRMED",
        total: 100,
      }),
      returnRepo,
    );
    expect(returnRepo.create).toHaveBeenCalledWith("s1", "broken", 100);
    expect(result.refundAmount).toBe(100);
  });

  it("allows a partial refund when below sale.total", async () => {
    const returnRepo = returnRepoMock();
    await createReturn(
      { tenantId: "t1", saleId: "s1", reason: "partial", refundAmount: 30 },
      saleRepoMock({
        id: "s1",
        tenantId: "t1",
        status: "DELIVERED",
        total: 100,
      }),
      returnRepo,
    );
    expect(returnRepo.create).toHaveBeenCalledWith("s1", "partial", 30);
  });

  it("rejects when sum(previous) + refundAmount > sale.total — without this, refunds were unbounded", async () => {
    const returnRepo = returnRepoMock({
      findBySaleId: vi
        .fn()
        .mockResolvedValue([
          {
            refundAmount: 70,
            id: "r0",
            saleId: "s1",
            reason: "p1",
            createdAt: new Date(),
          },
        ]),
    });
    await expect(
      createReturn(
        { tenantId: "t1", saleId: "s1", reason: "more", refundAmount: 50 },
        saleRepoMock({
          id: "s1",
          tenantId: "t1",
          status: "DELIVERED",
          total: 100,
        }),
        returnRepo,
      ),
    ).rejects.toThrow(RefundExceedsSaleTotalError);
    expect(returnRepo.create).not.toHaveBeenCalled();
  });

  it("allows a refund that exactly hits sale.total when no previous refunds exist", async () => {
    const returnRepo = returnRepoMock();
    await createReturn(
      { tenantId: "t1", saleId: "s1", reason: "full", refundAmount: 100 },
      saleRepoMock({ id: "s1", tenantId: "t1", status: "SHIPPED", total: 100 }),
      returnRepo,
    );
    expect(returnRepo.create).toHaveBeenCalledOnce();
  });
});
