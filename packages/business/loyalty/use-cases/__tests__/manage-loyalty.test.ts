import { describe, it, expect, vi } from "vitest";
import {
  earnFromSale,
  redeemPoints,
  getLoyaltyBalance,
  getLoyaltyStatement,
  POINTS_PER_BRL,
} from "../manage-loyalty";
import type { LoyaltyRepository } from "../../ports/loyalty-repository";
import {
  InsufficientLoyaltyBalanceError,
  LoyaltyAccountNotFoundError,
} from "../../domain/errors";

function repoMock(
  overrides: Partial<LoyaltyRepository> = {},
): LoyaltyRepository {
  const baseAccount = {
    id: "lp1",
    tenantId: "t1",
    clientId: "c1",
    balance: 0,
    lifetimeEarned: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  return {
    getOrCreate: vi.fn().mockResolvedValue(baseAccount),
    findByClientId: vi.fn().mockResolvedValue(baseAccount),
    applyTransaction: vi.fn().mockImplementation(({ delta }) =>
      Promise.resolve({
        ...baseAccount,
        balance: baseAccount.balance + delta,
        lifetimeEarned:
          delta > 0
            ? baseAccount.lifetimeEarned + delta
            : baseAccount.lifetimeEarned,
      }),
    ),
    listTransactions: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

describe("earnFromSale", () => {
  it("credits 1 point per BRL 10 by default", async () => {
    const repo = repoMock();
    await earnFromSale(
      { tenantId: "t1", clientId: "c1", saleId: "s1", saleTotal: 100 },
      repo,
    );
    expect(repo.applyTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "EARN",
        delta: Math.floor(100 * POINTS_PER_BRL),
        saleId: "s1",
      }),
    );
  });

  it("multiplies by the optional multiplier", async () => {
    const repo = repoMock();
    await earnFromSale(
      {
        tenantId: "t1",
        clientId: "c1",
        saleId: "s1",
        saleTotal: 100,
        multiplier: 2,
      },
      repo,
    );
    expect(repo.applyTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ delta: 20 }),
    );
  });

  it("does not call applyTransaction when the sale is too small to earn 1 point", async () => {
    const repo = repoMock();
    await earnFromSale(
      { tenantId: "t1", clientId: "c1", saleId: "s1", saleTotal: 5 },
      repo,
    );
    expect(repo.applyTransaction).not.toHaveBeenCalled();
    expect(repo.getOrCreate).toHaveBeenCalled();
  });
});

describe("redeemPoints", () => {
  it("rejects zero or negative redemptions", async () => {
    const repo = repoMock();
    await expect(
      redeemPoints({ tenantId: "t1", clientId: "c1", points: 0 }, repo),
    ).rejects.toBeInstanceOf(InsufficientLoyaltyBalanceError);
  });

  it("throws when the account does not exist", async () => {
    const repo = repoMock({ findByClientId: vi.fn().mockResolvedValue(null) });
    await expect(
      redeemPoints({ tenantId: "t1", clientId: "c1", points: 5 }, repo),
    ).rejects.toBeInstanceOf(LoyaltyAccountNotFoundError);
  });

  it("calls applyTransaction with a negative delta", async () => {
    const repo = repoMock();
    await redeemPoints(
      { tenantId: "t1", clientId: "c1", points: 5, note: "5% off" },
      repo,
    );
    expect(repo.applyTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "REDEEM",
        delta: -5,
        note: "5% off",
      }),
    );
  });
});

describe("getLoyaltyBalance / getLoyaltyStatement", () => {
  it("getLoyaltyBalance forwards to getOrCreate", async () => {
    const repo = repoMock();
    await getLoyaltyBalance("t1", "c1", repo);
    expect(repo.getOrCreate).toHaveBeenCalledWith("t1", "c1");
  });

  it("getLoyaltyStatement forwards limit", async () => {
    const repo = repoMock();
    await getLoyaltyStatement("t1", "c1", repo, 25);
    expect(repo.listTransactions).toHaveBeenCalledWith("t1", "c1", 25);
  });
});
