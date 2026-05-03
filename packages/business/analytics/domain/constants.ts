export const MS_PER_DAY = 1000 * 60 * 60 * 24;
export const DAYS_IN_WEEK = 7;

export const ENGAGEMENT_SCORE_MAX = 100;
export const ENGAGEMENT_WEIGHT_PER_SALE = 10;
export const ENGAGEMENT_RECENCY_THRESHOLD_RECENT = 30;
export const ENGAGEMENT_RECENCY_BONUS_RECENT = 30;
export const ENGAGEMENT_RECENCY_THRESHOLD_MODERATE = 60;
export const ENGAGEMENT_RECENCY_BONUS_MODERATE = 15;

// Engagement v2 (40/30/20/10): frequency 40 + recency 30 + ticket 20 + referrals 10.
// Each component caps at its own max so a single very-active dimension can't
// pretend to fill the others.
export const ENGAGEMENT_FREQUENCY_MAX = 40;
export const ENGAGEMENT_FREQUENCY_SATURATION_SALES = 8; // 8+ sales saturates frequency
export const ENGAGEMENT_RECENCY_MAX = 30;
export const ENGAGEMENT_TICKET_MAX = 20;
export const ENGAGEMENT_TICKET_BENCHMARK_BRL = 200; // R$200 = full ticket score
export const ENGAGEMENT_REFERRALS_MAX = 10;
export const ENGAGEMENT_REFERRALS_SATURATION = 4; // 4+ indicações saturate

export const ABC_PERCENTILE_A = 0.2;
export const ABC_PERCENTILE_B = 0.5;
