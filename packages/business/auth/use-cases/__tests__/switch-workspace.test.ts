// SwitchWorkspace — pick the active tenant from the caller's memberships
//
// Invariants:
//   - The target tenantId MUST appear in the caller's active memberships;
//     otherwise reject with "Acesso negado" (anti-IDOR).
//   - On success: returns memberId/role/plan from the matched membership.
import { describe, it, expect, vi } from "vitest";
import { SwitchWorkspace } from "../switch-workspace.use-case";
import type {
  TenantMemberRepository,
  TenantMemberWithTenantInfo,
} from "../../ports/tenant-member.repository";

function makeRow(
  overrides: Partial<TenantMemberWithTenantInfo> = {},
): TenantMemberWithTenantInfo {
  return {
    id: overrides.id ?? "mem-1",
    accountId: "acc-1",
    tenantId: overrides.tenantId ?? "tenant-1",
    role: overrides.role ?? "ADMIN",
    phone: null,
    displayName: null,
    avatar: null,
    isActive: true,
    deletedAt: null,
    joinedAt: new Date(),
    updatedAt: new Date(),
    tenantName: "Studio",
    tenantSlug: "studio",
    plan: overrides.plan ?? "ESSENTIAL",
    subscriptionStatus: "ACTIVE",
  } as unknown as TenantMemberWithTenantInfo;
}

function mockRepo(rows: TenantMemberWithTenantInfo[]): TenantMemberRepository {
  return {
    findById: vi.fn(),
    findByAccountAndTenant: vi.fn(),
    findActiveByAccountId: vi.fn().mockResolvedValue(rows),
    findActiveByTenantId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    countAdminsByTenantId: vi.fn(),
  };
}

describe("SwitchWorkspace", () => {
  it("returns the matched membership shape on access granted", async () => {
    const useCase = new SwitchWorkspace(
      mockRepo([
        makeRow({
          id: "mem-1",
          tenantId: "t1",
          role: "LEADER",
          plan: "PROFESSIONAL",
        }),
        makeRow({
          id: "mem-2",
          tenantId: "t2",
          role: "ADMIN",
          plan: "ESSENTIAL",
        }),
      ]),
    );

    const out = await useCase.execute({
      accountId: "acc-1",
      targetTenantId: "t2",
    });

    expect(out).toEqual({
      tenantId: "t2",
      memberId: "mem-2",
      role: "ADMIN",
      plan: "ESSENTIAL",
    });
  });

  it("rejects when the target is not in the caller's tenant list (anti-IDOR)", async () => {
    const useCase = new SwitchWorkspace(
      mockRepo([makeRow({ tenantId: "t1" })]),
    );

    await expect(
      useCase.execute({ accountId: "acc-1", targetTenantId: "t-stranger" }),
    ).rejects.toThrow(/Acesso negado/);
  });

  it("rejects when the caller has no memberships at all", async () => {
    const useCase = new SwitchWorkspace(mockRepo([]));
    await expect(
      useCase.execute({ accountId: "acc-orphan", targetTenantId: "t1" }),
    ).rejects.toThrow(/Acesso negado/);
  });
});
