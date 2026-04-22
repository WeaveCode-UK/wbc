// ACH-007 performance-escalabilidade: domain-aware cache invalidation.
//
// Before, `cacheInvalidatePatternForTenant()` existed but almost
// nobody called it — only `entitlements` invalidated, and only on
// plan-changed. After a client/sale/campaign mutation, the cached
// "dashboard" / "clients list" / "campaign stats" stayed stale until
// TTL expired. Users saw old data; support tickets.
//
// This module centralises the "which mutation touches which cache
// pattern" map so routers can just say `invalidateDomain(tenantId,
// 'sales')` instead of remembering every key shape.

import { cacheInvalidatePatternForTenant } from "./cache";
import { createLogger } from "./logger";

const logger = createLogger("cache-invalidation");

// Domain → patterns touched by any mutation in that domain. Keep
// patterns narrow so two unrelated domains don't wipe each other's
// caches; keep the list here so a new cache consumer adds itself
// explicitly.
const DOMAIN_PATTERNS: Record<string, string[]> = {
  clients: ["clients:*", "analytics:dashboard", "analytics:clients:*"],
  sales: ["sales:*", "analytics:dashboard", "analytics:sales:*"],
  campaigns: ["campaigns:*", "analytics:dashboard"],
  catalog: ["catalog:*", "catalog:public:*"],
  inventory: ["inventory:*", "analytics:dashboard"],
  finance: ["finance:*", "analytics:dashboard"],
};

export type CacheDomain = keyof typeof DOMAIN_PATTERNS;

/**
 * Invalidate every pattern a domain's mutations touch for a tenant.
 * Uses the tenant-scoped variant so there's no leak across tenants
 * in the SCAN cursor.
 */
export async function invalidateDomain(
  domain: CacheDomain | string,
): Promise<void> {
  const patterns = DOMAIN_PATTERNS[domain];
  if (!patterns) {
    logger.warn(
      { domain },
      "invalidateDomain called with unknown domain — skipping",
    );
    return;
  }
  await Promise.all(patterns.map((p) => cacheInvalidatePatternForTenant(p)));
}

/**
 * Convenience wrapper for mutations that want one-line invalidation.
 * Usage:
 *
 *   return withCacheInvalidation('sales', () => createSale(...));
 */
export async function withCacheInvalidation<T>(
  domain: CacheDomain | string,
  fn: () => Promise<T>,
): Promise<T> {
  const result = await fn();
  // Fire-and-forget — don't block the response on cache invalidation.
  // Stale reads between commit and invalidation last ≤ a few hundred ms.
  void invalidateDomain(domain).catch((err) => {
    logger.warn({ domain, err }, "Post-mutation invalidation failed");
  });
  return result;
}
