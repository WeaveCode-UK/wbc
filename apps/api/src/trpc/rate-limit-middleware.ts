import { TRPCError } from "@trpc/server";
import { getRedis } from "../lib/redis";

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const PUBLIC_LIMIT: RateLimitConfig = { windowMs: 60_000, maxRequests: 30 };
const PROTECTED_LIMIT: RateLimitConfig = { windowMs: 60_000, maxRequests: 100 };

/**
 * Per-route limits for sensitive endpoints (ACH-018). Matched by exact path
 * or by `path.startsWith(prefix)`. The first matching entry wins.
 *
 * Limits are intentionally tight — the goal is to make brute-force /
 * enumeration unviable from a single IP without affecting normal traffic.
 */
const SENSITIVE_ROUTE_LIMITS: Array<{
  prefix: string;
  config: RateLimitConfig;
}> = [
  { prefix: "auth.login", config: { windowMs: 60_000, maxRequests: 5 } },
  {
    prefix: "auth.requestPasswordReset",
    config: { windowMs: 60 * 60_000, maxRequests: 3 },
  },
  {
    prefix: "auth.resetPassword",
    config: { windowMs: 60 * 60_000, maxRequests: 5 },
  },
  {
    prefix: "auth.requestEmailVerification",
    config: { windowMs: 60 * 60_000, maxRequests: 3 },
  },
  { prefix: "auth.verifyEmail", config: { windowMs: 60_000, maxRequests: 10 } },
  {
    prefix: "auth.acceptInvite",
    config: { windowMs: 15 * 60_000, maxRequests: 10 },
  },
  { prefix: "auth.sendOtp", config: { windowMs: 60 * 60_000, maxRequests: 5 } },
  { prefix: "auth.verifyOtp", config: { windowMs: 60_000, maxRequests: 5 } },
];

function getKey(prefix: string, identifier: string, path: string): string {
  return `ratelimit:${prefix}:${identifier}:${path}`;
}

function findSensitiveLimit(path: string): RateLimitConfig | null {
  for (const entry of SENSITIVE_ROUTE_LIMITS) {
    if (path.startsWith(entry.prefix)) return entry.config;
  }
  return null;
}

async function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): Promise<{ allowed: boolean; remaining: number }> {
  const redis = getRedis();
  const windowSeconds = Math.ceil(config.windowMs / 1000);

  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, windowSeconds);
  }

  return {
    allowed: current <= config.maxRequests,
    remaining: Math.max(0, config.maxRequests - current),
  };
}

/**
 * Public rate limit. Identifier should be the client IP whenever available —
 * if absent, all anonymous traffic shares one bucket which makes the limit
 * trivial to defeat (ACH-018). The caller is expected to pass an IP from
 * `x-forwarded-for` / `x-real-ip` parsed at the HTTP boundary.
 */
export async function applyPublicRateLimit(
  path: string,
  identifier: string,
): Promise<void> {
  const sensitive = findSensitiveLimit(path);
  if (sensitive) {
    const key = getKey("sens", identifier, path);
    const { allowed } = await checkRateLimit(key, sensitive);
    if (!allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Rate limit exceeded",
      });
    }
    return;
  }

  const key = getKey("pub", identifier, path);
  const { allowed } = await checkRateLimit(key, PUBLIC_LIMIT);
  if (!allowed) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Rate limit exceeded",
    });
  }
}

export async function applyProtectedRateLimit(
  path: string,
  tenantId: string,
  userId: string,
): Promise<void> {
  const sensitive = findSensitiveLimit(path);
  if (sensitive) {
    const key = getKey("sens", `${tenantId}:${userId}`, path);
    const { allowed } = await checkRateLimit(key, sensitive);
    if (!allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Rate limit exceeded",
      });
    }
    return;
  }

  const key = getKey("auth", `${tenantId}:${userId}`, path);
  const { allowed } = await checkRateLimit(key, PROTECTED_LIMIT);
  if (!allowed) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Rate limit exceeded",
    });
  }
}
