// T-coverage — updateClient
//
// updateClient gates the mutation on a tenant-scoped findById. Without
// that guard, an attacker holding a known tenantId could overwrite a
// client they don't own. We assert:
//   - findById runs first with the provided tenantId
//   - update is NOT called when the client doesn't exist
//   - the data payload is forwarded verbatim (no silent field drops)
import { describe, it, expect, vi } from "vitest";
import { updateClient } from "../update-client";
import { ClientNotFoundError } from "../../domain/errors";
import type { ClientRepository } from "../../ports/client-repository";

function repoMock(overrides: Partial<ClientRepository> = {}): ClientRepository {
  return {
    findById: vi.fn().mockResolvedValue({ id: "c1", tenantId: "t1" }),
    findByPhone: vi.fn(),
    list: vi.fn(),
    create: vi.fn(),
    update: vi
      .fn()
      .mockImplementation((_t, id, data) =>
        Promise.resolve({ id, tenantId: "t1", ...data }),
      ),
    delete: vi.fn(),
    count: vi.fn(),
    listLeads: vi.fn(),
    convertToClient: vi.fn(),
    bulkEditNames: vi.fn(),
    bulkUpdate: vi.fn(),
    ...overrides,
  };
}

describe("updateClient use-case", () => {
  it("updates when the client exists in the tenant", async () => {
    const repo = repoMock();
    const result = await updateClient(
      { tenantId: "t1", id: "c1", data: { name: "New Name" } },
      repo,
    );
    expect(repo.findById).toHaveBeenCalledWith("t1", "c1");
    expect(repo.update).toHaveBeenCalledWith("t1", "c1", { name: "New Name" });
    expect(result.name).toBe("New Name");
  });

  it("throws ClientNotFoundError when client doesn't exist", async () => {
    const repo = repoMock({ findById: vi.fn().mockResolvedValue(null) });
    await expect(
      updateClient({ tenantId: "t1", id: "ghost", data: { name: "X" } }, repo),
    ).rejects.toThrow(ClientNotFoundError);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it("forwards multiple data fields verbatim", async () => {
    const repo = repoMock();
    await updateClient(
      {
        tenantId: "t1",
        id: "c1",
        data: {
          name: "Maria",
          email: "m@x.com",
          skinType: "OILY",
          isActive: false,
        },
      },
      repo,
    );
    expect(repo.update).toHaveBeenCalledWith("t1", "c1", {
      name: "Maria",
      email: "m@x.com",
      skinType: "OILY",
      isActive: false,
    });
  });
});
