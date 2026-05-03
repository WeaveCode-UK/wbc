// T-coverage — sample CRUD + ROI report
//
// Sample tracking is the consultant's "I gave away X to convert Y";
// the use-case is a thin pass-through over the repo. We assert each
// call forwards args verbatim and respects tenant scoping.
import { describe, it, expect, vi } from "vitest";
import {
  listSamples,
  createSample,
  markSampleConverted,
  getSampleROI,
} from "../manage-samples";
import type { SampleRepository } from "../../ports/sample-repository";

function repoMock(overrides: Partial<SampleRepository> = {}): SampleRepository {
  return {
    list: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    create: vi.fn().mockImplementation((data) =>
      Promise.resolve({
        id: "sa-1",
        tenantId: data.tenantId,
        productId: data.productId,
        clientId: data.clientId ?? null,
        quantity: data.quantity,
        cost: data.cost,
        resultedInSale: false,
        createdAt: new Date(),
      }),
    ),
    markConverted: vi.fn().mockImplementation((_t, id) =>
      Promise.resolve({
        id,
        tenantId: "t1",
        productId: "p1",
        clientId: null,
        quantity: 1,
        cost: 5,
        resultedInSale: true,
        createdAt: new Date(),
      }),
    ),
    getROI: vi.fn().mockResolvedValue({
      totalCost: 100,
      convertedCount: 3,
      totalSamples: 10,
    }),
    ...overrides,
  };
}

describe("listSamples", () => {
  it("forwards tenantId + page + limit verbatim", async () => {
    const repo = repoMock();
    await listSamples("t1", 2, 25, repo);
    expect(repo.list).toHaveBeenCalledWith("t1", 2, 25);
  });
});

describe("createSample", () => {
  it("delegates with the full payload", async () => {
    const repo = repoMock();
    await createSample("t1", "p1", "c1", 2, 5.5, repo);
    expect(repo.create).toHaveBeenCalledWith({
      tenantId: "t1",
      productId: "p1",
      clientId: "c1",
      quantity: 2,
      cost: 5.5,
    });
  });

  it("allows clientId to be undefined (free trial without target client)", async () => {
    const repo = repoMock();
    await createSample("t1", "p1", undefined, 1, 3, repo);
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: undefined }),
    );
  });
});

describe("markSampleConverted", () => {
  it("flips resultedInSale to true and forwards (tenantId, id)", async () => {
    const repo = repoMock();
    const result = await markSampleConverted("t1", "sa-1", repo);
    expect(repo.markConverted).toHaveBeenCalledWith("t1", "sa-1");
    expect(result.resultedInSale).toBe(true);
  });
});

describe("getSampleROI", () => {
  it("returns the repo report verbatim (totals computed at the SQL layer)", async () => {
    const repo = repoMock();
    const out = await getSampleROI("t1", repo);
    expect(repo.getROI).toHaveBeenCalledWith("t1");
    expect(out.totalCost).toBe(100);
    expect(out.convertedCount).toBe(3);
    expect(out.totalSamples).toBe(10);
  });
});
