// UpdateMember — caller updates their OWN profile fields on a membership
//
// Invariants:
//   - Member must exist.
//   - Caller's accountId must match the membership's accountId (anti-IDOR).
//   - Phone/displayName/avatar are forwarded verbatim to the repo update.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { UpdateMember } from "../update-member.use-case";
import type { TenantMemberRepository } from "../../ports/tenant-member.repository";
import { TenantMember } from "../../domain/entities/tenant-member.entity";

function makeMember(accountId = "acc-1"): TenantMember {
  return new TenantMember({
    id: "mem-1",
    accountId,
    tenantId: "tenant-1",
    role: "CONSULTANT",
    phone: null,
    displayName: null,
    avatar: null,
    isActive: true,
    deletedAt: null,
    joinedAt: new Date(),
    updatedAt: new Date(),
  });
}

function mockRepo(member: TenantMember | null): TenantMemberRepository {
  return {
    findById: vi.fn().mockResolvedValue(member),
    findByAccountAndTenant: vi.fn(),
    findActiveByAccountId: vi.fn(),
    findActiveByTenantId: vi.fn(),
    create: vi.fn(),
    update: vi.fn().mockResolvedValue(undefined),
    countAdminsByTenantId: vi.fn(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("UpdateMember", () => {
  it("updates the membership when caller owns it", async () => {
    const repo = mockRepo(makeMember("acc-1"));
    const useCase = new UpdateMember(repo);

    await useCase.execute({
      memberId: "mem-1",
      accountId: "acc-1",
      phone: "+55119",
      displayName: "Display",
      avatar: "https://cdn/a.png",
    });

    expect(repo.update).toHaveBeenCalledWith("mem-1", {
      phone: "+55119",
      displayName: "Display",
      avatar: "https://cdn/a.png",
    });
  });

  it("rejects when the member row is missing", async () => {
    const useCase = new UpdateMember(mockRepo(null));
    await expect(
      useCase.execute({ memberId: "ghost", accountId: "acc-1" }),
    ).rejects.toThrow(/Member nao encontrado/);
  });

  it("rejects when caller does not own the membership (anti-IDOR)", async () => {
    const useCase = new UpdateMember(mockRepo(makeMember("acc-other")));
    await expect(
      useCase.execute({ memberId: "mem-1", accountId: "acc-1" }),
    ).rejects.toThrow(/Unauthorized/);
  });

  it("forwards undefined fields verbatim (no over-zealous filtering)", async () => {
    const repo = mockRepo(makeMember("acc-1"));
    const useCase = new UpdateMember(repo);

    await useCase.execute({ memberId: "mem-1", accountId: "acc-1" });

    expect(repo.update).toHaveBeenCalledWith("mem-1", {
      phone: undefined,
      displayName: undefined,
      avatar: undefined,
    });
  });
});
