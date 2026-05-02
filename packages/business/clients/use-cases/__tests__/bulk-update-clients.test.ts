import { describe, it, expect, vi } from "vitest";
import { bulkUpdateClients } from "../bulk-update-clients";
import type { ClientRepository } from "../../ports/client-repository";

function repoMock(overrides: Partial<ClientRepository> = {}): ClientRepository {
  return {
    findById: vi.fn(),
    findByPhone: vi.fn(),
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    listLeads: vi.fn(),
    convertToClient: vi.fn(),
    bulkEditNames: vi.fn(),
    bulkUpdate: vi.fn().mockResolvedValue({ count: 0 }),
    ...overrides,
  };
}

describe("bulkUpdateClients", () => {
  it("returns 0 when ids is empty", async () => {
    const repo = repoMock();
    const result = await bulkUpdateClients(
      { tenantId: "t1", ids: [], data: { isActive: false } },
      repo,
    );
    expect(result.count).toBe(0);
    expect(repo.bulkUpdate).not.toHaveBeenCalled();
  });

  it("returns 0 when data is empty", async () => {
    const repo = repoMock();
    const result = await bulkUpdateClients(
      { tenantId: "t1", ids: ["c1"], data: {} },
      repo,
    );
    expect(result.count).toBe(0);
    expect(repo.bulkUpdate).not.toHaveBeenCalled();
  });

  it("caps the batch at 200 ids", async () => {
    const update = vi.fn().mockResolvedValue({ count: 200 });
    const repo = repoMock({ bulkUpdate: update });
    const ids = Array.from({ length: 500 }, (_, i) => `c${i}`);
    await bulkUpdateClients(
      { tenantId: "t1", ids, data: { isActive: false } },
      repo,
    );
    expect(update).toHaveBeenCalledOnce();
    const passedIds = update.mock.calls[0][1] as string[];
    expect(passedIds).toHaveLength(200);
  });

  it("forwards the data object as-is", async () => {
    const update = vi.fn().mockResolvedValue({ count: 1 });
    const repo = repoMock({ bulkUpdate: update });
    await bulkUpdateClients(
      {
        tenantId: "t1",
        ids: ["c1"],
        data: { classification: "A" as const },
      },
      repo,
    );
    expect(update).toHaveBeenCalledWith("t1", ["c1"], {
      classification: "A",
    });
  });
});
