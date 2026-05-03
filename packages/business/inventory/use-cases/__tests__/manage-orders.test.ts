// T-coverage — inventory order lifecycle (list/create/receive/cancel)
//
// Brand orders gate stock increments. ACH-027 added a state machine so
// only PENDING orders can be RECEIVED or CANCELLED — terminal states
// must reject. Without the guard, a CANCELLED order could be RECEIVED
// and re-trigger stock decrements downstream. We assert:
//   - happy path: PENDING → RECEIVED stamps a receivedAt
//   - happy path: PENDING → CANCELLED leaves receivedAt untouched
//   - missing order surfaces OrderNotFoundError before any state change
//   - already-RECEIVED + already-CANCELLED both throw InvalidOrderStatusError
//   - listOrders / createOrder forward args verbatim (tenant-scoped)
import { describe, it, expect, vi } from "vitest";
import {
  listOrders,
  createOrder,
  receiveOrder,
  cancelOrder,
} from "../manage-orders";
import {
  OrderNotFoundError,
  InvalidOrderStatusError,
} from "../../domain/errors";
import type { BrandOrderRepository } from "../../ports/brand-order-repository";

function repoMock(
  overrides: Partial<BrandOrderRepository> = {},
): BrandOrderRepository {
  return {
    findById: vi.fn().mockResolvedValue({
      id: "o1",
      tenantId: "t1",
      brandId: "b1",
      status: "PENDING",
      notes: null,
      orderedAt: new Date(),
      receivedAt: null,
      items: [],
    }),
    list: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockImplementation((data) =>
      Promise.resolve({
        id: "o-new",
        tenantId: data.tenantId,
        brandId: data.brandId,
        status: "PENDING" as const,
        notes: data.notes ?? null,
        orderedAt: new Date(),
        receivedAt: null,
      }),
    ),
    updateStatus: vi.fn().mockImplementation((_t, id, status, receivedAt) =>
      Promise.resolve({
        id,
        tenantId: "t1",
        brandId: "b1",
        status,
        notes: null,
        orderedAt: new Date(),
        receivedAt: receivedAt ?? null,
      }),
    ),
    ...overrides,
  };
}

describe("listOrders", () => {
  it("forwards tenantId + status filter verbatim", async () => {
    const repo = repoMock();
    await listOrders("t1", "PENDING", repo);
    expect(repo.list).toHaveBeenCalledWith("t1", "PENDING");
  });

  it("forwards undefined status (means 'all')", async () => {
    const repo = repoMock();
    await listOrders("t1", undefined, repo);
    expect(repo.list).toHaveBeenCalledWith("t1", undefined);
  });
});

describe("createOrder", () => {
  it("delegates to repo.create with the full payload", async () => {
    const repo = repoMock();
    const items = [{ productName: "Lipstick", quantity: 5, unitCost: 10 }];
    await createOrder("t1", "b1", items, "rush", repo);
    expect(repo.create).toHaveBeenCalledWith({
      tenantId: "t1",
      brandId: "b1",
      items,
      notes: "rush",
    });
  });
});

describe("receiveOrder", () => {
  it("flips a PENDING order to RECEIVED and stamps receivedAt", async () => {
    const repo = repoMock();
    const result = await receiveOrder("t1", "o1", repo);
    expect(repo.updateStatus).toHaveBeenCalledWith(
      "t1",
      "o1",
      "RECEIVED",
      expect.any(Date),
    );
    expect(result.status).toBe("RECEIVED");
    expect(result.receivedAt).toBeInstanceOf(Date);
  });

  it("throws OrderNotFoundError when the order doesn't exist", async () => {
    const repo = repoMock({ findById: vi.fn().mockResolvedValue(null) });
    await expect(receiveOrder("t1", "ghost", repo)).rejects.toThrow(
      OrderNotFoundError,
    );
    expect(repo.updateStatus).not.toHaveBeenCalled();
  });

  it("rejects receiving an already-RECEIVED order (terminal state)", async () => {
    const repo = repoMock({
      findById: vi.fn().mockResolvedValue({
        id: "o1",
        tenantId: "t1",
        brandId: "b1",
        status: "RECEIVED",
        notes: null,
        orderedAt: new Date(),
        receivedAt: new Date(),
        items: [],
      }),
    });
    await expect(receiveOrder("t1", "o1", repo)).rejects.toThrow(
      InvalidOrderStatusError,
    );
    expect(repo.updateStatus).not.toHaveBeenCalled();
  });

  it("rejects receiving a CANCELLED order — without this, stock would re-increment", async () => {
    const repo = repoMock({
      findById: vi.fn().mockResolvedValue({
        id: "o1",
        tenantId: "t1",
        brandId: "b1",
        status: "CANCELLED",
        notes: null,
        orderedAt: new Date(),
        receivedAt: null,
        items: [],
      }),
    });
    await expect(receiveOrder("t1", "o1", repo)).rejects.toThrow(
      InvalidOrderStatusError,
    );
  });
});

describe("cancelOrder", () => {
  it("flips a PENDING order to CANCELLED (no receivedAt stamp)", async () => {
    const repo = repoMock();
    const result = await cancelOrder("t1", "o1", repo);
    // updateStatus is called WITHOUT a receivedAt arg → no inadvertent stamp.
    expect(repo.updateStatus).toHaveBeenCalledWith("t1", "o1", "CANCELLED");
    expect(result.status).toBe("CANCELLED");
  });

  it("throws OrderNotFoundError when missing", async () => {
    const repo = repoMock({ findById: vi.fn().mockResolvedValue(null) });
    await expect(cancelOrder("t1", "ghost", repo)).rejects.toThrow(
      OrderNotFoundError,
    );
  });

  it("rejects cancelling a RECEIVED order — stock has already moved", async () => {
    const repo = repoMock({
      findById: vi.fn().mockResolvedValue({
        id: "o1",
        tenantId: "t1",
        brandId: "b1",
        status: "RECEIVED",
        notes: null,
        orderedAt: new Date(),
        receivedAt: new Date(),
        items: [],
      }),
    });
    await expect(cancelOrder("t1", "o1", repo)).rejects.toThrow(
      InvalidOrderStatusError,
    );
  });
});
