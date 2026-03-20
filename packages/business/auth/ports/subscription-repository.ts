import type { Subscription } from '../domain/subscription';

export interface SubscriptionRepository {
  findByTenantId(tenantId: string): Promise<Subscription | null>;
  updatePlan(tenantId: string, plan: string): Promise<Subscription>;
  incrementAIUsage(tenantId: string): Promise<number>;
  resetAIUsage(tenantId: string): Promise<void>;
}
