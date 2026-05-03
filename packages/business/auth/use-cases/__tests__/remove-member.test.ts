// RemoveMember — admin removes another member
//
// Invariants:
//   - Only ADMIN can remove members.
//   - Cross-tenant remove is blocked (member must belong to caller's tenant).
//   - Self-remove is blocked (use LeaveTenant for that).
//   - On success: deletedAt + isActive=false (soft delete).
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RemoveMember } from "../remove-member.use-case";
import type { TenantMemberRepository } from "../../ports/tenant-member.repository";
import {
  TenantMember,
  type Role,
} from "../../domain/entities/tenant-member.entity";

function makeMember(
  opts: {
    id?: string;
    accountId?: string;
    tenantId?: string;
    role?: Role;
  } = {},
): TenantMember {
  return new TenantMember({
    id: opts.id ?? "mem-1",
    accountId: opts.accountId ?? "acc-1",
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

describe("RemoveMember", () => {
  it("soft-deletes the target when an ADMIN runs the use-case", async () => {
    const repo = mockRepo({
      caller: makeMember({ accountId: "admin-acc", role: "ADMIN" }),
      target: makeMember({
        id: "mem-2",
        accountId: "victim",
        role: "CONSULTANT",
      }),
    });
    const useCase = new RemoveMember(repo);

    await useCase.execute({
      callerAccountId: "admin-acc",
      tenantId: "tenant-1",
      memberId: "mem-2",
    });

    expect(repo.update).toHaveBeenCalledWith(
      "mem-2",
      expect.objectContaining({ isActive: false }),
    );
    const arg = (repo.update as ReturnType<typeof vi.fn>).mock.calls[0]![1];
    expect(arg.deletedAt).toBeInstanceOf(Date);
  });

  it("rejects when caller is not a member of the tenant", async () => {
    const useCase = new RemoveMember(mockRepo({ caller: null }));
    await expect(
      useCase.execute({
        callerAccountId: "x",
        tenantId: "tenant-1",
        memberId: "mem-2",
      }),
    ).rejects.toThrow(/Apenas ADMIN/);
  });

  it("rejects when caller is a member but not ADMIN", async () => {
    const useCase = new RemoveMember(
      mockRepo({ caller: makeMember({ role: "LEADER" }) }),
    );
    await expect(
      useCase.execute({
        callerAccountId: "acc-1",
        tenantId: "tenant-1",
        memberId: "mem-2",
      }),
    ).rejects.toThrow(/Apenas ADMIN/);
  });

  it("rejects when the target member does not exist", async () => {
    const useCase = new RemoveMember(
      mockRepo({
        caller: makeMember({ accountId: "admin", role: "ADMIN" }),
        target: null,
      }),
    );
    await expect(
      useCase.execute({
        callerAccountId: "admin",
        tenantId: "tenant-1",
        memberId: "ghost",
      }),
    ).rejects.toThrow(/Membro nao encontrado/);
  });

  it("rejects cross-tenant remove (target.tenantId mismatch)", async () => {
    const repo = mockRepo({
      caller: makeMember({ accountId: "admin", role: "ADMIN" }),
      target: makeMember({
        id: "mem-2",
        accountId: "victim",
        tenantId: "tenant-other",
      }),
    });
    const useCase = new RemoveMember(repo);

    await expect(
      useCase.execute({
        callerAccountId: "admin",
        tenantId: "tenant-1",
        memberId: "mem-2",
      }),
    ).rejects.toThrow(/nao pertence/);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it("blocks self-remove (must use LeaveTenant)", async () => {
    const repo = mockRepo({
      caller: makeMember({ accountId: "admin", role: "ADMIN" }),
      target: makeMember({ id: "mem-1", accountId: "admin" }),
    });
    const useCase = new RemoveMember(repo);

    await expect(
      useCase.execute({
        callerAccountId: "admin",
        tenantId: "tenant-1",
        memberId: "mem-1",
      }),
    ).rejects.toThrow(/a si mesmo/);
  });
});
