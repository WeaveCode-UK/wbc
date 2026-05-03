// T-coverage — updateSaleStatus state machine (ACH-022)
//
// Without the SALE_TRANSITIONS guard, ANY status transition was allowed —
// including DRAFT → DELIVERED (skipping payment), CANCELLED → CONFIRMED
// (resurrecting cancelled orders) and DELIVERED → DRAFT (rewinding
// terminal states). Each illegal move also fired downstream events as
// if legitimate. We assert each rule of the matrix.
//
// Allowed transitions (per status.ts):
//   DRAFT     → CANCELLED
//   CONFIRMED → SEPARATED, CANCELLED
//   SEPARATED → SHIPPED,   CANCELLED
//   SHIPPED   → DELIVERED, CANCELLED
//   DELIVERED → ∅ (terminal)
//   CANCELLED → ∅ (terminal)
//
// Note: CONFIRMED is reached via the dedicated confirm-sale flow, not via
// updateStatus, so DRAFT → CONFIRMED is illegal here on purpose.
import { describe, it, expect, vi, beforeEach } from "vitest";

const { publishMock } = vi.hoisted(() => ({ publishMock: vi.fn() }));
vi.mock("@wbc/shared", () => ({
  publish: publishMock,
  EVENTS: { SALE_STATUS_CHANGED: "SALE_STATUS_CHANGED" },
}));

import { updateSaleStatus } from "../update-sale-status";
import { SaleNotFoundError, InvalidSaleStatusError } from "../../domain/errors";
import type { SaleRepository } from "../../ports/sale-repository";

function repoMock(sale: Record<string, unknown> | null): SaleRepository {
  return {
    findById: vi.fn().mockResolvedValue(sale),
    list: vi.fn(),
    create: vi.fn(),
    updateStatus: vi
      .fn()
      .mockImplementation((_t, id, status) =>
        Promise.resolve({ ...sale, id, status }),
      ),
    confirmAtomic: vi.fn(),
    delete: vi.fn(),
  } as unknown as SaleRepository;
}

beforeEach(() => {
  publishMock.mockClear();
});

describe("updateSaleStatus — allowed transitions", () => {
  const allowed: Array<[string, string]> = [
    ["DRAFT", "CANCELLED"],
    ["CONFIRMED", "SEPARATED"],
    ["CONFIRMED", "CANCELLED"],
    ["SEPARATED", "SHIPPED"],
    ["SEPARATED", "CANCELLED"],
    ["SHIPPED", "DELIVERED"],
    ["SHIPPED", "CANCELLED"],
  ];

  it.each(allowed)("permits %s → %s", async (from, to) => {
    const repo = repoMock({ id: "s1", tenantId: "t1", status: from });
    const result = await updateSaleStatus("t1", "s1", to, repo);
    expect(result.status).toBe(to);
    expect(repo.updateStatus).toHaveBeenCalledWith("t1", "s1", to);
  });
});

describe("updateSaleStatus — forbidden transitions", () => {
  const forbidden: Array<[string, string]> = [
    // DRAFT → CONFIRMED is reached through confirm-sale, not updateStatus
    ["DRAFT", "CONFIRMED"],
    ["DRAFT", "DELIVERED"],
    ["DRAFT", "SHIPPED"],
    // Resurrecting a cancelled sale is the canonical attack
    ["CANCELLED", "CONFIRMED"],
    ["CANCELLED", "DRAFT"],
    // Rewinding past terminal state
    ["DELIVERED", "DRAFT"],
    ["DELIVERED", "SHIPPED"],
    // Skipping intermediate states
    ["CONFIRMED", "DELIVERED"],
    ["CONFIRMED", "SHIPPED"],
    ["SEPARATED", "DELIVERED"],
  ];

  it.each(forbidden)("rejects %s → %s", async (from, to) => {
    const repo = repoMock({ id: "s1", tenantId: "t1", status: from });
    await expect(updateSaleStatus("t1", "s1", to, repo)).rejects.toThrow(
      InvalidSaleStatusError,
    );
    expect(repo.updateStatus).not.toHaveBeenCalled();
    expect(publishMock).not.toHaveBeenCalled();
  });
});

describe("updateSaleStatus — error edges", () => {
  it("throws SaleNotFoundError when the sale doesn't exist", async () => {
    const repo = repoMock(null);
    await expect(
      updateSaleStatus("t1", "ghost", "CANCELLED", repo),
    ).rejects.toThrow(SaleNotFoundError);
  });

  it("rejects unknown status strings (not in SALE_STATUSES)", async () => {
    const repo = repoMock({ id: "s1", tenantId: "t1", status: "DRAFT" });
    await expect(
      updateSaleStatus("t1", "s1", "PROCESSING", repo),
    ).rejects.toThrow(InvalidSaleStatusError);
  });

  it("emits SALE_STATUS_CHANGED with old + new status on a successful transition", async () => {
    const repo = repoMock({ id: "s1", tenantId: "t1", status: "DRAFT" });
    await updateSaleStatus("t1", "s1", "CANCELLED", repo);
    expect(publishMock).toHaveBeenCalledWith(
      "SALE_STATUS_CHANGED",
      "t1",
      expect.objectContaining({
        tenantId: "t1",
        saleId: "s1",
        oldStatus: "DRAFT",
        newStatus: "CANCELLED",
      }),
    );
  });
});
