import type { AnalyticsRepository } from "../ports/analytics-repository";

export async function getSalesStats(
  tenantId: string,
  period: string | undefined,
  repo: AnalyticsRepository,
) {
  return repo.getSalesStats(tenantId);
}

export async function getProductRanking(
  tenantId: string,
  limit: number = 10,
  repo?: AnalyticsRepository,
) {
  if (!repo) return [];
  return repo.getProductRanking(tenantId, limit);
}

export async function getClientEngagement(
  tenantId: string,
  clientId: string,
  repo?: AnalyticsRepository,
) {
  if (!repo) {
    return {
      score: 0,
      breakdown: {
        salesCount: 0,
        totalSpent: 0,
        daysSinceLastPurchase: -1,
        avgTicket: 0,
        referralsCount: 0,
      },
      components: { frequency: 0, recency: 0, ticket: 0, referrals: 0 },
    };
  }
  return repo.getClientEngagement(tenantId, clientId);
}

export async function calculateABCClassification(
  tenantId: string,
  repo?: AnalyticsRepository,
) {
  if (!repo) return { updated: 0 };
  return repo.calculateABCClassification(tenantId);
}
