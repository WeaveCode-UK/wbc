import { prisma } from "@wbc/db";

// F11.E09: progressive onboarding. Features unlock as the consultora
// reaches milestones, so a brand-new tenant doesn't see a wall of empty
// screens. The lock keys are intentionally coarse: the UI shows
// hint badges and the tRPC layer can also enforce them per-procedure
// when sensitive (e.g. campaigns require >=3 clients).

export const FEATURE_KEYS = [
  "campaigns", // unlocked at 3 clients
  "ai_text", // unlocked at 5 sent messages
  "loyalty", // unlocked at first sale
  "logistics", // unlocked at first sale
] as const;
export type FeatureKey = (typeof FEATURE_KEYS)[number];

const CAMPAIGNS_MIN_CLIENTS = 3;

export interface ProgressiveOnboardingState {
  hasFirstClient: boolean;
  hasFirstSale: boolean;
  hasFirstCampaign: boolean;
  unlockedFeatures: FeatureKey[];
}

/**
 * Read the current milestone state from the live data and return the
 * keys that should be unlocked. Idempotent — call after any mutation
 * that could move the needle (client create, sale confirm, etc.).
 */
export async function recomputeUnlockedFeatures(
  tenantId: string,
): Promise<ProgressiveOnboardingState> {
  const [clientCount, saleCount, campaignCount, messageCount] =
    await Promise.all([
      prisma.client.count({ where: { tenantId, isActive: true } }),
      prisma.sale.count({ where: { tenantId } }),
      prisma.campaign.count({ where: { tenantId } }),
      prisma.scheduledMessage.count({
        where: { tenantId, status: "SENT" },
      }),
    ]);

  const unlocked: FeatureKey[] = [];
  if (clientCount >= CAMPAIGNS_MIN_CLIENTS) unlocked.push("campaigns");
  if (messageCount >= 5) unlocked.push("ai_text");
  if (saleCount >= 1) {
    unlocked.push("loyalty");
    unlocked.push("logistics");
  }

  const state: ProgressiveOnboardingState = {
    hasFirstClient: clientCount >= 1,
    hasFirstSale: saleCount >= 1,
    hasFirstCampaign: campaignCount >= 1,
    unlockedFeatures: unlocked,
  };

  await prisma.onboardingProgress.upsert({
    where: { tenantId },
    update: {
      hasFirstClient: state.hasFirstClient,
      hasFirstSale: state.hasFirstSale,
      hasFirstCampaign: state.hasFirstCampaign,
      unlockedFeatures: state.unlockedFeatures,
    },
    create: {
      tenantId,
      hasFirstClient: state.hasFirstClient,
      hasFirstSale: state.hasFirstSale,
      hasFirstCampaign: state.hasFirstCampaign,
      unlockedFeatures: state.unlockedFeatures,
    },
  });

  return state;
}

export async function getUnlockedFeatures(
  tenantId: string,
): Promise<ProgressiveOnboardingState> {
  const row = await prisma.onboardingProgress.findUnique({
    where: { tenantId },
  });
  if (!row) {
    return recomputeUnlockedFeatures(tenantId);
  }
  return {
    hasFirstClient: row.hasFirstClient,
    hasFirstSale: row.hasFirstSale,
    hasFirstCampaign: row.hasFirstCampaign,
    unlockedFeatures: Array.isArray(row.unlockedFeatures)
      ? (row.unlockedFeatures as FeatureKey[])
      : [],
  };
}

export function isFeatureUnlocked(
  state: ProgressiveOnboardingState,
  key: FeatureKey,
): boolean {
  return state.unlockedFeatures.includes(key);
}
