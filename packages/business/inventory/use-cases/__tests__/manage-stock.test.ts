// T-coverage — stock CRUD + alerts
//
// Stock is the canonical "do we have it?" surface. After every mutation
// we publish STOCK_DEPLETED (qty <= 0) or STOCK_LOW (qty <= minAlert).
// The depleted check wins over low — if both fired we'd send a noisy
// duplicate notification. We assert:
//   - listStock forwards lowOnly filter verbatim
//   - updateStock + adjustStock fire the correct event for the new qty
//   - decrementForSale checks alerts for EACH item (not just the last)
//   - `minAlert = 0` disables the low-stock alert (publish never fires
//     for low) — without this guard, every product without a configured
//     min would trigger spam at quantity 0
import { describe, it, expect, vi, beforeEach } from "vitest";

const { publishMock } = vi.hoisted(() => ({ publishMock: vi.fn() }));

vi.mock("@wbc/shared", () => ({
  publish: publishMock,
  EVENTS: {
    STOCK_LOW: "STOCK_LOW",
    STOCK_DEPLETED: "STOCK_DEPLETED",
  },
}));

import {
  listStock,
  updateStock,
  adjustStock,
  decrementStockForSale,
} from "../manage-stock";
import type { StockRepository } from "../../ports/stock-repository";
import type { Stock } from "../../domain/entities";

function fakeStock(overrides: Partial<Stock> = {}): Stock {
  return {
    id: "s1",
    tenantId: "t1",
    productId: "p1",
    quantity: 10,
    minAlert: 5,
    ...overrides,
  };
}

function repoMock(overrides: Partial<StockRepository> = {}): StockRepository {
  return {
    findByProductId: vi.fn().mockResolvedValue(fakeStock()),
    list: vi.fn().mockResolvedValue([]),
    updateQuantity: vi
      .fn()
      .mockImplementation((_t, productId, quantity) =>
        Promise.resolve(fakeStock({ productId, quantity })),
      ),
    adjustQuantity: vi
      .fn()
      .mockImplementation((_t, productId, adjustment) =>
        Promise.resolve(fakeStock({ productId, quantity: 10 + adjustment })),
      ),
    decrementForSale: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

beforeEach(() => {
  publishMock.mockClear();
});

describe("listStock", () => {
  it("forwards tenantId + lowOnly verbatim", async () => {
    const repo = repoMock();
    await listStock("t1", true, repo);
    expect(repo.list).toHaveBeenCalledWith("t1", true);
  });

  it("forwards undefined lowOnly", async () => {
    const repo = repoMock();
    await listStock("t1", undefined, repo);
    expect(repo.list).toHaveBeenCalledWith("t1", undefined);
  });
});

describe("updateStock", () => {
  it("does NOT publish when quantity stays above minAlert", async () => {
    const repo = repoMock({
      updateQuantity: vi
        .fn()
        .mockResolvedValue(fakeStock({ quantity: 20, minAlert: 5 })),
    });
    await updateStock("t1", "p1", 20, repo);
    expect(publishMock).not.toHaveBeenCalled();
  });

  it("publishes STOCK_LOW when quantity drops to/under minAlert", async () => {
    const repo = repoMock({
      updateQuantity: vi
        .fn()
        .mockResolvedValue(fakeStock({ quantity: 3, minAlert: 5 })),
    });
    await updateStock("t1", "p1", 3, repo);
    expect(publishMock).toHaveBeenCalledWith(
      "STOCK_LOW",
      "t1",
      expect.objectContaining({ tenantId: "t1", productId: "p1", quantity: 3 }),
    );
  });

  it("publishes STOCK_DEPLETED at quantity 0 (depleted wins over low)", async () => {
    const repo = repoMock({
      updateQuantity: vi
        .fn()
        .mockResolvedValue(fakeStock({ quantity: 0, minAlert: 5 })),
    });
    await updateStock("t1", "p1", 0, repo);
    expect(publishMock).toHaveBeenCalledOnce();
    expect(publishMock).toHaveBeenCalledWith(
      "STOCK_DEPLETED",
      "t1",
      expect.objectContaining({ productId: "p1" }),
    );
  });

  it("publishes STOCK_DEPLETED on negative quantity (oversell guard)", async () => {
    const repo = repoMock({
      updateQuantity: vi
        .fn()
        .mockResolvedValue(fakeStock({ quantity: -1, minAlert: 5 })),
    });
    await updateStock("t1", "p1", -1, repo);
    expect(publishMock).toHaveBeenCalledWith(
      "STOCK_DEPLETED",
      "t1",
      expect.any(Object),
    );
  });

  it("does NOT publish STOCK_LOW when minAlert is 0 (alert disabled)", async () => {
    const repo = repoMock({
      updateQuantity: vi
        .fn()
        .mockResolvedValue(fakeStock({ quantity: 1, minAlert: 0 })),
    });
    await updateStock("t1", "p1", 1, repo);
    expect(publishMock).not.toHaveBeenCalled();
  });
});

describe("adjustStock", () => {
  it("delegates to repo.adjustQuantity with adjustment delta", async () => {
    const repo = repoMock();
    await adjustStock("t1", "p1", -5, repo);
    expect(repo.adjustQuantity).toHaveBeenCalledWith("t1", "p1", -5);
  });

  it("triggers STOCK_LOW alert when the adjustment crosses the threshold", async () => {
    const repo = repoMock({
      adjustQuantity: vi
        .fn()
        .mockResolvedValue(fakeStock({ quantity: 4, minAlert: 5 })),
    });
    await adjustStock("t1", "p1", -6, repo);
    expect(publishMock).toHaveBeenCalledWith(
      "STOCK_LOW",
      "t1",
      expect.any(Object),
    );
  });
});

describe("decrementStockForSale", () => {
  it("delegates to repo.decrementForSale and re-checks alerts per product", async () => {
    const repo = repoMock({
      findByProductId: vi.fn().mockImplementation((_t, productId) =>
        Promise.resolve(
          fakeStock({
            productId,
            quantity: productId === "p1" ? 0 : 100,
            minAlert: 5,
          }),
        ),
      ),
    });
    await decrementStockForSale(
      "t1",
      [
        { productId: "p1", quantity: 1 },
        { productId: "p2", quantity: 1 },
      ],
      repo,
    );
    expect(repo.decrementForSale).toHaveBeenCalledWith("t1", [
      { productId: "p1", quantity: 1 },
      { productId: "p2", quantity: 1 },
    ]);
    // Only p1 (qty=0) should fire — p2 (qty=100) is above minAlert.
    expect(publishMock).toHaveBeenCalledOnce();
    expect(publishMock).toHaveBeenCalledWith(
      "STOCK_DEPLETED",
      "t1",
      expect.objectContaining({ productId: "p1" }),
    );
  });

  it("skips alert check for products that no longer have a stock row", async () => {
    const repo = repoMock({
      findByProductId: vi.fn().mockResolvedValue(null),
    });
    await decrementStockForSale(
      "t1",
      [{ productId: "p-deleted", quantity: 1 }],
      repo,
    );
    expect(publishMock).not.toHaveBeenCalled();
  });
});
