import { prisma } from '@wbc/db';
import type { TenantRepository } from '../use-cases/register-tenant';

// Auth 2.0: This adapter is DEPRECATED. Will be replaced in F10.E03.

export class PrismaTenantRepository implements TenantRepository {
  async findBySlug(slug: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });
    return tenant;
  }

  async create(data: { name: string; slug: string }) {
    const tenant = await prisma.tenant.create({
      data: {
        name: data.name,
        slug: data.slug,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        locale: true,
        timezone: true,
        currency: true,
      },
    });
    return tenant;
  }

  async createSubscription(tenantId: string, plan: string): Promise<void> {
    await prisma.subscription.create({
      data: {
        tenantId,
        plan: plan as 'ESSENTIAL' | 'PRO',
        status: 'ACTIVE',
        startsAt: new Date(),
      },
    });
  }

  async onboardTenant(input: {
    tenantName: string;
    slug: string;
    accountId: string;
    displayName: string;
    phone: string;
    avatar?: string | null;
  }): Promise<{ tenantId: string; memberId: string }> {
    return prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: input.tenantName,
          slug: input.slug,
          timezone: 'America/Sao_Paulo',
          locale: 'pt-BR',
          currency: 'BRL',
          isActive: true,
        },
      });
      await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          plan: 'ESSENTIAL',
          status: 'TRIAL',
          startsAt: new Date(),
          expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      });
      const member = await tx.tenantMember.create({
        data: {
          accountId: input.accountId,
          tenantId: tenant.id,
          role: 'ADMIN',
          phone: input.phone,
          displayName: input.displayName,
          avatar: input.avatar ?? null,
        },
      });
      return { tenantId: tenant.id, memberId: member.id };
    });
  }
}
