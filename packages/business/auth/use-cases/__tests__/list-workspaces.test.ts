// ListWorkspaces — flatten a member's tenants into a UI-shaped list
//
// Invariants:
//   - The use-case projects TenantMember + tenant info into a flat shape:
//     `{ tenantId, tenantName, slug, role, plan, status }`.
//   - Order is preserved (no sort surprises).
//   - Empty membership list resolves to [].
import { describe, it, expect, vi } from "vitest";
import { ListWorkspaces } from "../list-workspaces.use-case";
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
    role: overrides.role ?? "CONSULTANT",
    phone: null,
    displayName: null,
    avatar: null,
    isActive: true,
    deletedAt: null,
    joinedAt: new Date(),
    updatedAt: new Date(),
    tenantName: overrides.tenantName ?? "Studio One",
    tenantSlug: overrides.tenantSlug ?? "studio-one",
    plan: overrides.plan ?? "ESSENTIAL",
    subscriptionStatus: overrides.subscriptionStatus ?? "ACTIVE",
    // The class-vs-shape conflict: we only need the duck-typed properties
    // because the use-case calls plain `.tenantId` etc. on each row.
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

describe("ListWorkspaces", () => {
  it("projects member rows into the UI shape", async () => {
    const repo = mockRepo([
      makeRow({
        tenantId: "t1",
        tenantName: "Alpha",
        tenantSlug: "alpha",
        role: "ADMIN",
        plan: "ESSENTIAL",
        subscriptionStatus: "ACTIVE",
      }),
    ]);
    const useCase = new ListWorkspaces(repo);

    const result = await useCase.execute({ accountId: "acc-1" });

    expect(result).toEqual([
      {
        tenantId: "t1",
        tenantName: "Alpha",
        slug: "alpha",
        role: "ADMIN",
        plan: "ESSENTIAL",
        status: "ACTIVE",
      },
    ]);
  });

  it("preserves order across multiple workspaces", async () => {
    const repo = mockRepo([
      makeRow({ tenantId: "t1", tenantName: "Alpha", tenantSlug: "alpha" }),
      makeRow({ tenantId: "t2", tenantName: "Beta", tenantSlug: "beta" }),
    ]);
    const useCase = new ListWorkspaces(repo);

    const result = await useCase.execute({ accountId: "acc-1" });

    expect(result.map((r) => r.tenantId)).toEqual(["t1", "t2"]);
  });

  it("returns [] when the account has no workspaces", async () => {
    const useCase = new ListWorkspaces(mockRepo([]));
    const result = await useCase.execute({ accountId: "ghost" });
    expect(result).toEqual([]);
  });

  it("scopes by accountId (passed through to the repo)", async () => {
    const repo = mockRepo([]);
    const useCase = new ListWorkspaces(repo);
    await useCase.execute({ accountId: "acc-7" });
    expect(repo.findActiveByAccountId).toHaveBeenCalledWith("acc-7");
  });
});
