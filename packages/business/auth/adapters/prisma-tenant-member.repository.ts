import { prisma } from '@wbc/db';
import type {
  TenantMemberRepository,
  CreateTenantMemberInput,
  UpdateTenantMemberInput,
  TenantMemberWithTenantInfo,
} from '../ports/tenant-member.repository';
import { TenantMember } from '../domain/entities/tenant-member.entity';

export class PrismaTenantMemberRepository implements TenantMemberRepository {
  async findById(id: string): Promise<TenantMember | null> {
    const data = await prisma.tenantMember.findUnique({ where: { id } });
    if (!data) return null;
    return new TenantMember(data);
  }

  async findByAccountAndTenant(accountId: string, tenantId: string): Promise<TenantMember | null> {
    const data = await prisma.tenantMember.findUnique({
      where: { accountId_tenantId: { accountId, tenantId } },
    });
    if (!data) return null;
    return new TenantMember(data);
  }

  async findActiveByAccountId(accountId: string): Promise<TenantMemberWithTenantInfo[]> {
    const data = await prisma.tenantMember.findMany({
      where: { accountId, isActive: true, deletedAt: null },
      include: {
        tenant: {
          include: {
            subscriptions: { where: { status: { not: 'CANCELLED' } }, take: 1 },
          },
        },
      },
    });
    return data.map((d) => {
      const sub = d.tenant.subscriptions[0];
      const member = new TenantMember(d) as TenantMemberWithTenantInfo;
      Object.defineProperty(member, 'tenantName', { value: d.tenant.name, enumerable: true });
      Object.defineProperty(member, 'tenantSlug', { value: d.tenant.slug, enumerable: true });
      Object.defineProperty(member, 'plan', { value: sub?.plan ?? 'ESSENTIAL', enumerable: true });
      Object.defineProperty(member, 'subscriptionStatus', { value: sub?.status ?? 'INACTIVE', enumerable: true });
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

  async update(id: string, input: UpdateTenantMemberInput): Promise<TenantMember> {
    const data = await prisma.tenantMember.update({ where: { id }, data: input });
    return new TenantMember(data);
  }

  async countAdminsByTenantId(tenantId: string): Promise<number> {
    return prisma.tenantMember.count({
      where: { tenantId, role: 'ADMIN', isActive: true, deletedAt: null },
    });
  }
}
