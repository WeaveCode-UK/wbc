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
}
