import type { Plan } from '@wbc/shared';

export interface Subscription {
  id: string;
  tenantId: string;
  plan: Plan;
  status: string;
  startsAt: Date;
  expiresAt: Date | null;
  aiGenerationsUsed: number;
  aiGenerationsLimit: number;
}

export type Feature = 'WHATSAPP_N2';

const PRO_FEATURES: Feature[] = ['WHATSAPP_N2'];

export function canUseFeature(plan: Plan, feature: Feature): boolean {
  if (PRO_FEATURES.includes(feature)) {
    return plan === 'PRO';
  }
  return true;
}

export function isSubscriptionActive(subscription: Subscription): boolean {
  if (subscription.status !== 'ACTIVE' && subscription.status !== 'TRIAL') {
    return false;
  }
  if (subscription.expiresAt && new Date() > subscription.expiresAt) {
    return false;
  }
  return true;
}

export function hasAIGenerationsRemaining(subscription: Subscription): boolean {
  return subscription.aiGenerationsUsed < subscription.aiGenerationsLimit;
}
