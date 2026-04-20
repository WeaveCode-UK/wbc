import { prisma } from "@wbc/db";
import type {
  TenantMemberRepository,
  CreateTenantMemberInput,
  UpdateTenantMemberInput,
  TenantMemberWithTenantInfo,
} from "../ports/tenant-member.repository";
import { TenantMember } from "../domain/entities/tenant-member.entity";

export class PrismaTenantMemberRepository implements TenantMemberRepository {
  async findById(id: string): Promise<TenantMember | null> {
    const data = await prisma.tenantMember.findUnique({ where: { id } });
    if (!data) return null;
    return new TenantMember(data);
  }

  async findByAccountAndTenant(
    accountId: string,
    tenantId: string,
  ): Promise<TenantMember | null> {
    const data = await prisma.tenantMember.findUnique({
      where: { accountId_tenantId: { accountId, tenantId } },
    });
    if (!data) return null;
    return new TenantMember(data);
  }

  async findActiveByAccountId(
    accountId: string,
  ): Promise<TenantMemberWithTenantInfo[]> {
    const data = await prisma.tenantMember.findMany({
      where: { accountId, isActive: true, deletedAt: null },
      include: {
        tenant: {
          include: { subscription: true },
        },
      },
    });
    return data.map((d) => {
      const sub = d.tenant.subscription;
      const member = new TenantMember(d) as TenantMemberWithTenantInfo;
      Object.defineProperty(member, "tenantName", {
        value: d.tenant.name,
        enumerable: true,
      });
      Object.defineProperty(member, "tenantSlug", {
        value: d.tenant.slug,
        enumerable: true,
      });
      Object.defineProperty(member, "plan", {
        value: sub?.plan ?? "ESSENTIAL",
        enumerable: true,
      });
      Object.defineProperty(member, "subscriptionStatus", {
        value: sub?.status ?? "INACTIVE",
        enumerable: true,
      });
      return member;
    });
  }

  async findActiveByTenantId(tenantId: string): Promise<TenantMember[]> {
    const data = await prisma.tenantMember.findMany({
      where: { tenantId, isActive: true, deletedAt: null },
    });
    return data.map((d) => new TenantMember(d));
  }

  async create(input: CreateTenantMemberInput): Promise<TenantMember> {
    const data = await prisma.tenantMember.create({ data: input });
    return new TenantMember(data);
  }

  async update(
    id: string,
    input: UpdateTenantMemberInput,
  ): Promise<TenantMember> {
    // ACH-008: whitelist fields instead of splatting `input` into Prisma
    // (accountId, tenantId and joinedAt are immutable for a given member).
    const updateData: Record<string, unknown> = {};
    if (input.role !== undefined) updateData.role = input.role;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.displayName !== undefined)
      updateData.displayName = input.displayName;
    if (input.avatar !== undefined) updateData.avatar = input.avatar;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;
    if (input.deletedAt !== undefined) updateData.deletedAt = input.deletedAt;

    const data = await prisma.tenantMember.update({
      where: { id },
      data: updateData,
    });
    return new TenantMember(data);
  }

  async countAdminsByTenantId(tenantId: string): Promise<number> {
    return prisma.tenantMember.count({
      where: { tenantId, role: "ADMIN", isActive: true, deletedAt: null },
    });
  }
}
