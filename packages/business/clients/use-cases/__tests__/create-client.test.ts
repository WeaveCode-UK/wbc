import { describe, it, expect, vi } from "vitest";
import { createClient } from "../create-client";
import type { ClientRepository } from "../../ports/client-repository";
import {
  DuplicatePhoneError,
  InvalidClientDataError,
} from "../../domain/errors";

function mockRepo(overrides: Partial<ClientRepository> = {}): ClientRepository {
  return {
    findById: vi.fn().mockResolvedValue(null),
    findByPhone: vi.fn().mockResolvedValue(null),
    list: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    create: vi
      .fn()
      .mockImplementation((data) =>
        Promise.resolve({
          id: "c1",
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
          engagementScore: 0,
          classification: "C",
          firstPurchaseAt: null,
        }),
      ),
    update: vi.fn().mockResolvedValue(null),
    delete: vi.fn().mockResolvedValue(undefined),
    count: vi.fn().mockResolvedValue(0),
    listLeads: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    convertToClient: vi.fn().mockResolvedValue(null),
    bulkEditNames: vi.fn().mockResolvedValue(0),
    bulkUpdate: vi.fn().mockResolvedValue({ count: 0 }),
    ...overrides,
  };
}

describe("createClient use-case", () => {
  it("creates a client with valid data", async () => {
    const repo = mockRepo();
    const client = await createClient(
      { tenantId: "t1", name: "Maria", phone: "11999999999" },
      repo,
    );
    expect(client.name).toBe("Maria");
    expect(client.phone).toBe("+5511999999999");
    expect(repo.create).toHaveBeenCalledOnce();
  });

  it("formats phone to E.164", async () => {
    const repo = mockRepo();
    await createClient(
      { tenantId: "t1", name: "Ana", phone: "5511999999999" },
      repo,
    );
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ phone: "+5511999999999" }),
    );
  });

  it("throws InvalidClientDataError for invalid phone", async () => {
    const repo = mockRepo();
    await expect(
      createClient({ tenantId: "t1", name: "X", phone: "abc" }, repo),
    ).rejects.toThrow(InvalidClientDataError);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("throws DuplicatePhoneError for existing phone", async () => {
    const repo = mockRepo({
      findByPhone: vi.fn().mockResolvedValue({ id: "existing" }),
    });
    await expect(
      createClient({ tenantId: "t1", name: "Y", phone: "11999999999" }, repo),
    ).rejects.toThrow(DuplicatePhoneError);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("defaults source to MANUAL and isLead to false", async () => {
    const repo = mockRepo();
    await createClient(
      { tenantId: "t1", name: "Z", phone: "11999999999" },
      repo,
    );
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ source: "MANUAL", isLead: false }),
    );
  });

  it("passes optional fields when provided", async () => {
    const repo = mockRepo();
    await createClient(
      {
        tenantId: "t1",
        name: "B",
        phone: "11999999999",
        email: "b@test.com",
        skinType: "OILY",
        isLead: true,
      },
      repo,
    );
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "b@test.com",
        skinType: "OILY",
        isLead: true,
      }),
    );
  });
});
