import type {
  AnalyticsRepository,
  TemporalComparison,
} from "../ports/analytics-repository";

export async function getTemporalComparison(
  tenantId: string,
  repo: AnalyticsRepository,
): Promise<TemporalComparison> {
  return repo.getTemporalComparison(tenantId);
}
