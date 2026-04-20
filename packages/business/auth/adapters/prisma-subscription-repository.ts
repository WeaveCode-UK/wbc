import { prisma } from "@wbc/db";
import type { SubscriptionRepository } from "../ports/subscription-repository";
import type { Subscription } from "../domain/subscription";
import { OptimisticLockError, type Plan } from "@wbc/shared";

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
      data: { plan: plan as "ESSENTIAL" | "PRO" },
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
    // ACH-003 dados-persistencia: retry-loop CAS. `updateMany` with
    // WHERE { version: expected } is the UPDATE ... WHERE version = ?
    // shape — affected-row count of 0 means another writer bumped the
    // version between our read and write, so we retry with fresh state.
    const MAX_RETRIES = 5;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const current = await prisma.subscription.findUnique({
        where: { tenantId },
        select: { aiGenerationsUsed: true, version: true },
      });
      if (!current) {
        throw new Error(`Subscription not found for tenant ${tenantId}`);
      }

      const { count } = await prisma.subscription.updateMany({
        where: { tenantId, version: current.version },
        data: {
          aiGenerationsUsed: { increment: 1 },
          version: { increment: 1 },
        },
      });
      if (count === 1) return current.aiGenerationsUsed + 1;
      // count === 0: version conflict. Retry.
    }
    throw new OptimisticLockError("Subscription", MAX_RETRIES + 1);
  }

  async resetAIUsage(tenantId: string): Promise<void> {
    await prisma.subscription.update({
      where: { tenantId },
      data: { aiGenerationsUsed: 0 },
    });
  }
}
