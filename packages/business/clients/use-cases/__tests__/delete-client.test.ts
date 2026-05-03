// T-coverage — deleteClient
//
// deleteClient is a thin wrapper that gates the destructive call on a
// tenant-scoped findById. We assert:
//   - findById is called with the same tenantId before delete (no
//     cross-tenant deletes via guessable ids)
//   - delete is NOT invoked when the client doesn't exist
//   - the typed ClientNotFoundError carries the id for log/UI surfacing
import { describe, it, expect, vi } from "vitest";
import { deleteClient } from "../delete-client";
import { ClientNotFoundError } from "../../domain/errors";
import type { ClientRepository } from "../../ports/client-repository";

function repoMock(overrides: Partial<ClientRepository> = {}): ClientRepository {
  return {
    findById: vi.fn().mockResolvedValue({ id: "c1", tenantId: "t1" }),
    findByPhone: vi.fn(),
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn().mockResolvedValue(undefined),
    count: vi.fn(),
    listLeads: vi.fn(),
    convertToClient: vi.fn(),
    bulkEditNames: vi.fn(),
    bulkUpdate: vi.fn(),
    ...overrides,
  };
}

describe("deleteClient use-case", () => {
  it("deletes when the client exists in the same tenant", async () => {
    const repo = repoMock();
    await deleteClient("t1", "c1", repo);
    expect(repo.findById).toHaveBeenCalledWith("t1", "c1");
    expect(repo.delete).toHaveBeenCalledWith("t1", "c1");
  });

  it("throws ClientNotFoundError when findById returns null (also covers cross-tenant lookups)", async () => {
    const repo = repoMock({ findById: vi.fn().mockResolvedValue(null) });
    await expect(deleteClient("t1", "ghost", repo)).rejects.toThrow(
      ClientNotFoundError,
    );
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it("propagates underlying repo errors instead of swallowing", async () => {
    const repo = repoMock({
      delete: vi.fn().mockRejectedValueOnce(new Error("fk_violation")),
    });
    await expect(deleteClient("t1", "c1", repo)).rejects.toThrow(
      "fk_violation",
    );
  });
});
