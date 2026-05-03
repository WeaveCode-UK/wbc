// T-coverage — listClients
//
// Pass-through to repo.list; the only invariant we lock in is that
// tenantId / filters / pagination land at the repo unchanged. The repo
// is the boundary that owns tenant scoping; the use-case must not
// rewrite filter shape (silent rewrites have caused leaks in the past).
import { describe, it, expect, vi } from "vitest";
import { listClients } from "../list-clients";
import type { ClientRepository } from "../../ports/client-repository";

function repoMock(overrides: Partial<ClientRepository> = {}): ClientRepository {
  return {
    findById: vi.fn(),
    findByPhone: vi.fn(),
    list: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    listLeads: vi.fn(),
    convertToClient: vi.fn(),
    bulkEditNames: vi.fn(),
    bulkUpdate: vi.fn(),
    ...overrides,
  };
}

describe("listClients use-case", () => {
  it("forwards tenantId + filters + page + limit verbatim", async () => {
    const repo = repoMock();
    await listClients(
      {
        tenantId: "t1",
        filters: { search: "ana", isActive: true, tagIds: ["tag-1"] },
        page: 2,
        limit: 25,
      },
      repo,
    );
    expect(repo.list).toHaveBeenCalledWith(
      "t1",
      { search: "ana", isActive: true, tagIds: ["tag-1"] },
      2,
      25,
    );
  });

  it("returns the repo payload as-is", async () => {
    const repo = repoMock({
      list: vi.fn().mockResolvedValue({
        data: [{ id: "c1", tenantId: "t1", name: "X" }],
        total: 1,
      }),
    });
    const out = await listClients(
      { tenantId: "t1", filters: {}, page: 1, limit: 10 },
      repo,
    );
    expect(out.total).toBe(1);
    expect(out.data).toHaveLength(1);
  });

  it("works with empty filters", async () => {
    const repo = repoMock();
    await listClients(
      { tenantId: "t-empty", filters: {}, page: 1, limit: 10 },
      repo,
    );
    expect(repo.list).toHaveBeenCalledWith("t-empty", {}, 1, 10);
  });
});
