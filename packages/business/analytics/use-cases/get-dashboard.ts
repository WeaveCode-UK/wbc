import type { AnalyticsRepository } from '../ports/analytics-repository';

export async function getAnalyticsDashboard(tenantId: string, repo: AnalyticsRepository) {
  return repo.getDashboard(tenantId);
}
