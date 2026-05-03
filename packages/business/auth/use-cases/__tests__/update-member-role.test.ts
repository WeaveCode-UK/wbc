// UpdateMemberRole — promote/demote a member with hierarchy guard
//
// Hierarchy: CONSULTANT(0) < LEADER(1) < DIRECTOR(2) < ADMIN(3).
// Rule: caller cannot grant a role >= their own. (No self-elevation,
// no ADMIN grant from a non-ADMIN.)
//
// Invariants:
//   - Caller must be a member of `callerTenantId`.
//   - Target member must belong to the same tenant.
//   - On success: repo.update({ role: newRole }) on the target.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { UpdateMemberRole } from "../update-member-role.use-case";
import type { TenantMemberRepository } from "../../ports/tenant-member.repository";
import {
  TenantMember,
  type Role,
} from "../../domain/entities/tenant-member.entity";

function makeMember(
  opts: {
    id?: string;
    role?: Role;
    tenantId?: string;
  } = {},
): TenantMember {
  return new TenantMember({
    id: opts.id ?? "mem-1",
    accountId: "acc-1",
    tenantId: opts.tenantId ?? "tenant-1",
    role: opts.role ?? "CONSULTANT",
    phone: null,
    displayName: null,
    avatar: null,
    isActive: true,
    deletedAt: null,
    joinedAt: new Date(),
    updatedAt: new Date(),
  });
}

function mockRepo(
  opts: {
    caller?: TenantMember | null;
    target?: TenantMember | null;
  } = {},
): TenantMemberRepository {
  return {
    findById: vi.fn().mockResolvedValue(opts.target ?? null),
    findByAccountAndTenant: vi.fn().mockResolvedValue(opts.caller ?? null),
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

describe("UpdateMemberRole", () => {
  it("ADMIN can promote CONSULTANT → DIRECTOR", async () => {
    const repo = mockRepo({
      caller: makeMember({ role: "ADMIN" }),
      target: makeMember({ id: "mem-2", role: "CONSULTANT" }),
    });
    const useCase = new UpdateMemberRole(repo);

    await useCase.execute({
      callerAccountId: "acc-1",
      callerTenantId: "tenant-1",
      memberId: "mem-2",
      newRole: "DIRECTOR",
    });

    expect(repo.update).toHaveBeenCalledWith("mem-2", { role: "DIRECTOR" });
  });

  it("rejects when caller is not a member of the tenant", async () => {
    const useCase = new UpdateMemberRole(mockRepo({ caller: null }));
    await expect(
      useCase.execute({
        callerAccountId: "stranger",
        callerTenantId: "tenant-1",
        memberId: "mem-2",
        newRole: "LEADER",
      }),
    ).rejects.toThrow(/Caller nao e membro/);
  });

  it("blocks self-elevation: LEADER cannot grant LEADER (target == caller level)", async () => {
    const useCase = new UpdateMemberRole(
      mockRepo({
        caller: makeMember({ role: "LEADER" }),
        target: makeMember({ id: "mem-2", role: "CONSULTANT" }),
      }),
    );

    await expect(
      useCase.execute({
        callerAccountId: "acc-1",
        callerTenantId: "tenant-1",
        memberId: "mem-2",
        newRole: "LEADER",
      }),
    ).rejects.toThrow(/Permissao insuficiente/);
  });

  it("blocks elevation above caller: DIRECTOR cannot grant ADMIN", async () => {
    const useCase = new UpdateMemberRole(
      mockRepo({
        caller: makeMember({ role: "DIRECTOR" }),
        target: makeMember({ id: "mem-2", role: "CONSULTANT" }),
      }),
    );

    await expect(
      useCase.execute({
        callerAccountId: "acc-1",
        callerTenantId: "tenant-1",
        memberId: "mem-2",
        newRole: "ADMIN",
      }),
    ).rejects.toThrow(/Permissao insuficiente/);
  });

  it("rejects when target member does not exist", async () => {
    const useCase = new UpdateMemberRole(
      mockRepo({
        caller: makeMember({ role: "ADMIN" }),
        target: null,
      }),
    );

    await expect(
      useCase.execute({
        callerAccountId: "acc-1",
        callerTenantId: "tenant-1",
        memberId: "ghost",
        newRole: "LEADER",
      }),
    ).rejects.toThrow(/Membro nao encontrado/);
  });

  it("rejects cross-tenant target (tenant scoping)", async () => {
    const useCase = new UpdateMemberRole(
      mockRepo({
        caller: makeMember({ role: "ADMIN" }),
        target: makeMember({ id: "mem-2", tenantId: "tenant-other" }),
      }),
    );

    await expect(
      useCase.execute({
        callerAccountId: "acc-1",
        callerTenantId: "tenant-1",
        memberId: "mem-2",
        newRole: "LEADER",
      }),
    ).rejects.toThrow(/nao pertence/);
  });

  it("DIRECTOR can promote CONSULTANT → LEADER (below own level)", async () => {
    const repo = mockRepo({
      caller: makeMember({ role: "DIRECTOR" }),
      target: makeMember({ id: "mem-2", role: "CONSULTANT" }),
    });
    const useCase = new UpdateMemberRole(repo);

    await useCase.execute({
      callerAccountId: "acc-1",
      callerTenantId: "tenant-1",
      memberId: "mem-2",
      newRole: "LEADER",
    });
    expect(repo.update).toHaveBeenCalledWith("mem-2", { role: "LEADER" });
  });
});
