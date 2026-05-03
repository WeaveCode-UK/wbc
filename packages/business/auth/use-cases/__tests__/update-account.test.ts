// UpdateAccount — change profile fields on the Account row
//
// Invariants:
//   - Account must exist.
//   - The exact `name` from input is forwarded to repo.update.
//   - Returns the updated Account.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { UpdateAccount } from "../update-account.use-case";
import type { AccountRepository } from "../../ports/account.repository";
import { Account } from "../../domain/entities/account.entity";

function makeAccount(name = "Old Name"): Account {
  return new Account({
    id: "acc-1",
    email: "user@example.com",
    name,
    emailVerified: new Date(),
    passwordHash: "$2a$10$h",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function mockRepo(existing: Account | null): AccountRepository {
  return {
    findById: vi.fn().mockResolvedValue(existing),
    findByEmail: vi.fn(),
    create: vi.fn(),
    update: vi.fn().mockImplementation(async (_id, input) => {
      return makeAccount(input.name ?? "Old Name");
    }),
    delete: vi.fn(),
    deleteWithCleanup: vi.fn(),
    markLoggedIn: vi.fn(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("UpdateAccount", () => {
  it("updates the account name and returns the new Account", async () => {
    const repo = mockRepo(makeAccount());
    const useCase = new UpdateAccount(repo);

    const updated = await useCase.execute({
      accountId: "acc-1",
      name: "New Name",
    });

    expect(repo.update).toHaveBeenCalledWith("acc-1", { name: "New Name" });
    expect(updated.name).toBe("New Name");
  });

  it("rejects when the account does not exist", async () => {
    const useCase = new UpdateAccount(mockRepo(null));
    await expect(
      useCase.execute({ accountId: "ghost", name: "x" }),
    ).rejects.toThrow(/nao encontrada/i);
  });

  it("forwards undefined name verbatim (caller-controlled noop)", async () => {
    const repo = mockRepo(makeAccount());
    const useCase = new UpdateAccount(repo);

    await useCase.execute({ accountId: "acc-1" });

    // Use-case does NOT filter out undefined — that is the repo's job.
    expect(repo.update).toHaveBeenCalledWith("acc-1", { name: undefined });
  });
});
