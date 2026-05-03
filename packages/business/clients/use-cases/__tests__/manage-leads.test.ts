// T-coverage — listLeads + convertToClient
//
// Lead conversion mutates a row from isLead=true to a real client; if
// the lead doesn't exist (or belongs to another tenant) we MUST throw
// before persisting anything. We assert:
//   - listLeads forwards tenantId + page + limit verbatim
//   - convertToClient throws ClientNotFoundError when missing
//   - convertToClient delegates to repo.convertToClient with the same
//     (tenantId, id) when the lead exists
import { describe, it, expect, vi } from "vitest";
import { listLeads, convertToClient } from "../manage-leads";
import { ClientNotFoundError } from "../../domain/errors";
import type { ClientRepository } from "../../ports/client-repository";

function repoMock(overrides: Partial<ClientRepository> = {}): ClientRepository {
  return {
    findById: vi.fn().mockResolvedValue({
      id: "lead-1",
      tenantId: "t1",
      isLead: true,
    }),
    findByPhone: vi.fn(),
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    listLeads: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    convertToClient: vi
      .fn()
      .mockImplementation((_t, id) =>
        Promise.resolve({ id, tenantId: "t1", isLead: false }),
      ),
    bulkEditNames: vi.fn(),
    bulkUpdate: vi.fn(),
    ...overrides,
  };
}

describe("listLeads", () => {
  it("forwards tenantId + page + limit verbatim", async () => {
    const repo = repoMock();
    await listLeads("t1", 3, 50, repo);
    expect(repo.listLeads).toHaveBeenCalledWith("t1", 3, 50);
  });

  it("returns the repo payload as-is", async () => {
    const repo = repoMock({
      listLeads: vi.fn().mockResolvedValue({
        data: [{ id: "lead-1", tenantId: "t1", isLead: true }],
        total: 1,
      }),
    });
    const out = await listLeads("t1", 1, 10, repo);
    expect(out.total).toBe(1);
    expect(out.data).toHaveLength(1);
  });
});

describe("convertToClient", () => {
  it("converts when the lead exists in the tenant", async () => {
    const repo = repoMock();
    const result = await convertToClient("t1", "lead-1", repo);
    expect(repo.findById).toHaveBeenCalledWith("t1", "lead-1");
    expect(repo.convertToClient).toHaveBeenCalledWith("t1", "lead-1");
    expect(result.isLead).toBe(false);
  });

  it("throws ClientNotFoundError when the lead doesn't exist (cross-tenant lookups land here too)", async () => {
    const repo = repoMock({ findById: vi.fn().mockResolvedValue(null) });
    await expect(convertToClient("t1", "ghost", repo)).rejects.toThrow(
      ClientNotFoundError,
    );
    expect(repo.convertToClient).not.toHaveBeenCalled();
  });
});
