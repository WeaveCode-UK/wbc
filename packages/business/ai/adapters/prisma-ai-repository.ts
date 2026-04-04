import { prisma } from '@wbc/db';
import type { AIRepository, AIUsage } from '../ports/ai-repository';

export class PrismaAIRepository implements AIRepository {
  async getUsage(tenantId: string): Promise<AIUsage> {
    const sub = await prisma.subscription.findUnique({ where: { tenantId } });
    if (!sub) return { used: 0, limit: 30, remaining: 30 };
    return { used: sub.aiGenerationsUsed, limit: sub.aiGenerationsLimit, remaining: sub.aiGenerationsLimit - sub.aiGenerationsUsed };
  }

  async checkLimit(tenantId: string): Promise<void> {
    const sub = await prisma.subscription.findUnique({ where: { tenantId } });
    if (sub && sub.aiGenerationsUsed >= sub.aiGenerationsLimit) {
      throw new Error('AI generation limit reached for this month');
    }
  }

  async recordGeneration(tenantId: string, type: string, inputTokens: number, outputTokens: number, model: string, prompt: string, result: string): Promise<void> {
    await prisma.aIGeneration.create({
      data: { tenantId, type: type as 'CAMPAIGN' | 'BILLING' | 'REACTIVATION' | 'CORRECTION', inputTokens, outputTokens, model, prompt, result },
    });
    await prisma.subscription.update({
      where: { tenantId },
      data: { aiGenerationsUsed: { increment: 1 } },
    });
  }
}
