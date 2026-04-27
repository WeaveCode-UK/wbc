import { TRPCError } from "@trpc/server";
// ACH-015: tenant-scoped helpers throw on missing ALS context, killing the
// silent-cross-tenant-leak class of bug at the helper boundary.
import {
  cacheGetForTenant,
  cacheSetForTenant,
  CACHE_TTL,
  getTenantScopedRedis,
} from "./cache";
import { PrismaSubscriptionRepository } from "../../../../packages/business/auth/adapters/prisma-subscription-repository";
import {
  canUseFeature,
  isSubscriptionActive,
} from "../../../../packages/business/auth/domain/subscription";
import type { Feature } from "../../../../packages/business/auth/domain/subscription";
import type { Plan } from "@wbc/shared";

const subscriptionRepo = new PrismaSubscriptionRepository();

interface CachedEntitlements {
  plan: Plan;
  isActive: boolean;
  aiUsed: number;
  aiLimit: number;
}

const CACHE_KEY = "entitlements";

export async function getEntitlements(
  tenantId: string,
): Promise<CachedEntitlements> {
  const cached = await cacheGetForTenant<CachedEntitlements>(CACHE_KEY);
  if (cached) return cached;

  const sub = await subscriptionRepo.findByTenantId(tenantId);
  if (!sub) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Subscription not found",
    });
  }

  const entitlements: CachedEntitlements = {
    plan: sub.plan,
    isActive: isSubscriptionActive(sub),
    aiUsed: sub.aiGenerationsUsed,
    aiLimit: sub.aiGenerationsLimit,
  };

  await cacheSetForTenant(CACHE_KEY, entitlements, CACHE_TTL.ENTITLEMENTS);

  return entitlements;
}

export async function invalidateEntitlements(_tenantId: string): Promise<void> {
  // ACH-015: TenantScopedRedis exposes delete(); the helper resolves the
  // tenant prefix from AsyncLocalStorage automatically.
  await getTenantScopedRedis().delete(CACHE_KEY);
}

export async function requirePlan(
  tenantId: string,
  requiredPlan: Plan,
): Promise<void> {
  const entitlements = await getEntitlements(tenantId);

  if (!entitlements.isActive) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Subscription is not active",
    });
  }

  if (requiredPlan === "PRO" && entitlements.plan !== "PRO") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This feature requires the Pro plan",
    });
  }
}

export async function requireFeature(
  tenantId: string,
  feature: Feature,
): Promise<void> {
  const entitlements = await getEntitlements(tenantId);

  if (!entitlements.isActive) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Subscription is not active",
    });
  }

  if (!canUseFeature(entitlements.plan, feature)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Feature ${feature} requires Pro plan`,
    });
  }
}
