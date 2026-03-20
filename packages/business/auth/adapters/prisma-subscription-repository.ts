import { prisma } from '@wbc/db';
import type { SubscriptionRepository } from '../ports/subscription-repository';
import type { Subscription } from '../domain/subscription';
import type { Plan } from '@wbc/shared';

export class PrismaSubscriptionRepository implements SubscriptionRepository {
  async findByTenantId(tenantId: string): Promise<Subscription | null> {
    const sub = await prisma.subscription.findUnique({
      where: { tenantId },
    });
    if (!sub) return null;
    return {
      id: sub.id,
      tenantId: sub.tenantId,
      plan: sub.plan as Plan,
      status: sub.status,
      startsAt: sub.startsAt,
      expiresAt: sub.expiresAt,
      aiGenerationsUsed: sub.aiGenerationsUsed,
      aiGenerationsLimit: sub.aiGenerationsLimit,
    };
  }

  async updatePlan(tenantId: string, plan: string): Promise<Subscription> {
    const sub = await prisma.subscription.update({
      where: { tenantId },
      data: { plan: plan as 'ESSENTIAL' | 'PRO' },
    });
    return {
      id: sub.id,
      tenantId: sub.tenantId,
      plan: sub.plan as Plan,
      status: sub.status,
      startsAt: sub.startsAt,
      expiresAt: sub.expiresAt,
      aiGenerationsUsed: sub.aiGenerationsUsed,
      aiGenerationsLimit: sub.aiGenerationsLimit,
    };
  }

  async incrementAIUsage(tenantId: string): Promise<number> {
    const sub = await prisma.subscription.update({
      where: { tenantId },
      data: { aiGenerationsUsed: { increment: 1 } },
      select: { aiGenerationsUsed: true },
    });
    return sub.aiGenerationsUsed;
  }

  async resetAIUsage(tenantId: string): Promise<void> {
    await prisma.subscription.update({
      where: { tenantId },
      data: { aiGenerationsUsed: 0 },
    });
  }
}
