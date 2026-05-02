import { describe, it, expect, vi } from "vitest";
import { importClients } from "../import-clients";
import type { ClientRepository } from "../../ports/client-repository";

function repoMock(overrides: Partial<ClientRepository> = {}): ClientRepository {
  return {
    findById: vi.fn().mockResolvedValue(null),
    findByPhone: vi.fn().mockResolvedValue(null),
    list: vi.fn(),
    create: vi.fn().mockImplementation((data) =>
      Promise.resolve({
        id: "c-new",
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
        engagementScore: 0,
        classification: "C",
        firstPurchaseAt: null,
      }),
    ),
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

describe("importClients", () => {
  it("imports valid rows and reports the count", async () => {
    const repo = repoMock();
    const result = await importClients(
      {
        tenantId: "t1",
        rows: [
          { name: "Ana", phone: "11999990001" },
          { name: "Beatriz", phone: "11999990002" },
        ],
      },
      repo,
    );
    expect(result.total).toBe(2);
    expect(result.imported).toBe(2);
    expect(result.skipped).toEqual([]);
    expect(repo.create).toHaveBeenCalledTimes(2);
  });

  it("skips rows with invalid phone", async () => {
    const repo = repoMock();
    const result = await importClients(
      {
        tenantId: "t1",
        rows: [
          { name: "Ana", phone: "11999990001" },
          { name: "Bruna", phone: "abc" },
        ],
      },
      repo,
    );
    expect(result.imported).toBe(1);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0]?.reason).toBe("invalid_phone");
    expect(result.skipped[0]?.row).toBe(2);
  });

  it("skips rows with missing name", async () => {
    const repo = repoMock();
    const result = await importClients(
      {
        tenantId: "t1",
        rows: [{ name: "  ", phone: "11999990001" }],
      },
      repo,
    );
    expect(result.imported).toBe(0);
    expect(result.skipped[0]?.reason).toBe("missing_name");
  });

  it("dedups within the batch", async () => {
    const repo = repoMock();
    const result = await importClients(
      {
        tenantId: "t1",
        rows: [
          { name: "Ana", phone: "11999990001" },
          { name: "Ana 2", phone: "11999990001" },
        ],
      },
      repo,
    );
    expect(result.imported).toBe(1);
    expect(result.skipped[0]?.reason).toBe("duplicate_in_batch");
  });

  it("dedups against existing rows in the database", async () => {
    const repo = repoMock({
      findByPhone: vi
        .fn()
        .mockResolvedValueOnce({ id: "existing" })
        .mockResolvedValueOnce(null),
    });
    const result = await importClients(
      {
        tenantId: "t1",
        rows: [
          { name: "Ana", phone: "11999990001" },
          { name: "Beatriz", phone: "11999990002" },
        ],
      },
      repo,
    );
    expect(result.imported).toBe(1);
    expect(result.skipped[0]?.reason).toBe("duplicate_in_db");
  });

  it("caps the batch at 5000 rows", async () => {
    const repo = repoMock();
    const rows = Array.from({ length: 6000 }, (_, i) => ({
      name: `Cliente ${i}`,
      phone: `1199999${String(i).padStart(4, "0")}`,
    }));
    const result = await importClients({ tenantId: "t1", rows }, repo);
    expect(result.total).toBe(5000);
  });
});
