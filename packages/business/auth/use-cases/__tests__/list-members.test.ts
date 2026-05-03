// ListMembers — read-only list of active members for a tenant
//
// Invariants:
//   - Pure pass-through to memberRepo.findActiveByTenantId(tenantId).
//   - Tenant scoping: tenantId is the filter key; it MUST be the only
//     argument forwarded.
import { describe, it, expect, vi } from "vitest";
import { ListMembers } from "../list-members.use-case";
import type { TenantMemberRepository } from "../../ports/tenant-member.repository";
import { TenantMember } from "../../domain/entities/tenant-member.entity";

function makeMember(id: string, tenantId: string): TenantMember {
  return new TenantMember({
    id,
    accountId: `acc-${id}`,
    tenantId,
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

function mockRepo(members: TenantMember[]): TenantMemberRepository {
  return {
    findById: vi.fn(),
    findByAccountAndTenant: vi.fn(),
    findActiveByAccountId: vi.fn(),
    findActiveByTenantId: vi.fn().mockResolvedValue(members),
    create: vi.fn(),
    update: vi.fn(),
    countAdminsByTenantId: vi.fn(),
  };
}

describe("ListMembers", () => {
  it("returns the tenant's active members", async () => {
    const members = [
      makeMember("m1", "tenant-1"),
      makeMember("m2", "tenant-1"),
    ];
    const repo = mockRepo(members);
    const useCase = new ListMembers(repo);

    const result = await useCase.execute({ tenantId: "tenant-1" });

    expect(result).toBe(members);
    expect(repo.findActiveByTenantId).toHaveBeenCalledWith("tenant-1");
    expect(repo.findActiveByTenantId).toHaveBeenCalledOnce();
  });

  it("forwards exactly the tenantId (no extra args leak)", async () => {
    const repo = mockRepo([]);
    const useCase = new ListMembers(repo);

    await useCase.execute({ tenantId: "tenant-99" });

    const args = (repo.findActiveByTenantId as ReturnType<typeof vi.fn>).mock
      .calls[0]!;
    expect(args).toEqual(["tenant-99"]);
  });

  it("returns an empty array when the repo returns none", async () => {
    const useCase = new ListMembers(mockRepo([]));
    const result = await useCase.execute({ tenantId: "empty" });
    expect(result).toEqual([]);
  });
});
