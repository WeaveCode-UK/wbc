import type {
  AnalyticsRepository,
  SeasonalityBucket,
} from "../ports/analytics-repository";

export async function getSeasonality(
  tenantId: string,
  monthsBack: number,
  repo: AnalyticsRepository,
): Promise<SeasonalityBucket[]> {
  return repo.getSeasonality(tenantId, monthsBack);
}
