// T-coverage — getSaleById
//
// Throws SaleNotFoundError when the sale doesn't exist OR belongs to a
// different tenant (the tenant filter is inside findById; from the
// caller's perspective both cases look identical, which is exactly the
// point — we don't leak the existence of cross-tenant sales).
import { describe, it, expect, vi } from "vitest";
import { getSaleById } from "../get-sale-by-id";
import { SaleNotFoundError } from "../../domain/errors";
import type { SaleRepository } from "../../ports/sale-repository";

function repoMock(sale: Record<string, unknown> | null): SaleRepository {
  return {
    findById: vi.fn().mockResolvedValue(sale),
    list: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn(),
    confirmAtomic: vi.fn(),
    delete: vi.fn(),
  } as unknown as SaleRepository;
}

describe("getSaleById use-case", () => {
  it("returns the sale when it exists in the tenant", async () => {
    const repo = repoMock({
      id: "s1",
      tenantId: "t1",
      status: "CONFIRMED",
      items: [{ id: "i1" }],
    });
    const out = await getSaleById("t1", "s1", repo);
    expect(repo.findById).toHaveBeenCalledWith("t1", "s1");
    expect(out.id).toBe("s1");
    expect(out.items).toHaveLength(1);
  });

  it("throws SaleNotFoundError when the sale doesn't exist (cross-tenant lookups land here too)", async () => {
    const repo = repoMock(null);
    await expect(getSaleById("t1", "ghost", repo)).rejects.toThrow(
      SaleNotFoundError,
    );
  });
});
