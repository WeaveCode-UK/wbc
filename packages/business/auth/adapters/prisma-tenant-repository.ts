import { prisma } from '@wbc/db';
import type { TenantRepository } from '../use-cases/register-tenant';

export class PrismaTenantRepository implements TenantRepository {
  async findByPhone(phone: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { phone },
      select: { id: true },
    });
    return tenant;
  }

  async create(data: { name: string; phone: string; slug: string }) {
    const tenant = await prisma.tenant.create({
      data: {
        name: data.name,
        phone: data.phone,
        slug: data.slug,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        slug: true,
        role: true,
        plan: true,
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
