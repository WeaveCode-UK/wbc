// T-coverage — listSales
//
// Pass-through over SaleRepository.list. Tenant scoping + pagination
// must reach the repo unmodified — the repo is the boundary that
// enforces tenant isolation.
import { describe, it, expect, vi } from "vitest";
import { listSales } from "../list-sales";
import type { SaleRepository } from "../../ports/sale-repository";

function repoMock(overrides: Partial<SaleRepository> = {}): SaleRepository {
  return {
    findById: vi.fn(),
    list: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    create: vi.fn(),
    updateStatus: vi.fn(),
    confirmAtomic: vi.fn(),
    delete: vi.fn(),
    ...overrides,
  } as unknown as SaleRepository;
}

describe("listSales use-case", () => {
  it("forwards tenantId + filters verbatim", async () => {
    const repo = repoMock();
    await listSales(
      "t1",
      { status: "CONFIRMED", clientId: "c1", page: 1, limit: 10 },
      repo,
    );
    expect(repo.list).toHaveBeenCalledWith("t1", {
      status: "CONFIRMED",
      clientId: "c1",
      page: 1,
      limit: 10,
    });
  });

  it("returns the repo payload as-is", async () => {
    const repo = repoMock({
      list: vi.fn().mockResolvedValue({
        data: [{ id: "s1", tenantId: "t1" }],
        total: 1,
      }),
    });
    const out = await listSales("t1", { page: 1, limit: 10 }, repo);
    expect(out.total).toBe(1);
    expect(out.data).toHaveLength(1);
  });

  it("works with no status / clientId filters", async () => {
    const repo = repoMock();
    await listSales("t1", { page: 1, limit: 50 }, repo);
    expect(repo.list).toHaveBeenCalledWith("t1", { page: 1, limit: 50 });
  });
});
