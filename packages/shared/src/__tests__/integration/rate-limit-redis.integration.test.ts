// T5.5 — Rate-limit window against a real Redis.
//
// WHY: the existing unit test uses an in-memory `incr/expire` stand-in,
// so it can't actually fail if `expire` is missing or the key TTL is
// off-by-one. This test wires a real Redis container, drives the same
// `INCR + EXPIRE` primitive the middleware uses, and confirms:
//   1. the (n)th request inside the window is allowed up to the cap;
//   2. the (n+1)th is rejected;
//   3. once the window TTL expires, the bucket resets and traffic
//      flows again.
//
// The middleware lives in `apps/api/src/trpc/rate-limit-middleware.ts`
// and depends on tRPC + the api-side `getRedis()` factory; we don't
// import it here to avoid pulling tRPC into the @wbc/shared graph.
// Instead we replicate its `checkRateLimit` semantics — same INCR
// pattern, same key shape — so a regression in the primitive (which
// is the actual concern) is caught.

import { describe, it, beforeAll, afterAll, expect } from "vitest";
import {
  RedisContainer,
  type StartedRedisContainer,
} from "@testcontainers/redis";
import Redis from "ioredis";

const SHOULD_RUN_INTEGRATION =
  process.env.CI === "true" ||
  process.env.CI === "1" ||
  process.env.RUN_INTEGRATION === "1";

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

async function checkRateLimit(
  redis: Redis,
  key: string,
  config: RateLimitConfig,
): Promise<{ allowed: boolean; remaining: number }> {
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

describe.skipIf(!SHOULD_RUN_INTEGRATION)("rate-limit window (redis)", () => {
  let container: StartedRedisContainer;
  let redis: Redis;

  beforeAll(async () => {
    container = await new RedisContainer("redis:7-alpine").start();
    redis = new Redis({
      host: container.getHost(),
      port: container.getPort(),
      // WHY: lazy connect would let the suite race past the start;
      // explicit ping confirms the container is actually serving.
      maxRetriesPerRequest: 1,
    });
    await redis.ping();
  }, 120_000);

  afterAll(async () => {
    redis?.disconnect();
    await container?.stop();
  });

  it("allows 30 requests in a 60s window and rejects the 31st", async () => {
    const key = `ratelimit:test:${Date.now()}:30in60`;
    const config: RateLimitConfig = { windowMs: 60_000, maxRequests: 30 };

    let lastRemaining = -1;
    for (let i = 0; i < 30; i++) {
      const { allowed, remaining } = await checkRateLimit(redis, key, config);
      expect(allowed).toBe(true);
      lastRemaining = remaining;
    }
    expect(lastRemaining).toBe(0);

    const overflow = await checkRateLimit(redis, key, config);
    expect(overflow.allowed).toBe(false);
    expect(overflow.remaining).toBe(0);
  });

  it("re-allows traffic once the window TTL expires", async () => {
    // WHY: keep the window short (1s) so the test stays fast. The
    // primitive uses second-resolution TTL anyway, so 1s is enough to
    // observe the reset.
    const key = `ratelimit:test:${Date.now()}:reset`;
    const config: RateLimitConfig = { windowMs: 1000, maxRequests: 2 };

    expect((await checkRateLimit(redis, key, config)).allowed).toBe(true);
    expect((await checkRateLimit(redis, key, config)).allowed).toBe(true);
    expect((await checkRateLimit(redis, key, config)).allowed).toBe(false);

    // WHY: wait for the TTL plus a small buffer. Redis EXPIRE rounds
    // down at sub-second resolution on some versions, so 1500ms is
    // a safe-but-not-flaky margin.
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const afterReset = await checkRateLimit(redis, key, config);
    expect(afterReset.allowed).toBe(true);
  });

  it("isolates buckets by key — separate identifiers don't share quota", async () => {
    const config: RateLimitConfig = { windowMs: 60_000, maxRequests: 5 };
    const keyA = `ratelimit:test:${Date.now()}:tenant-A`;
    const keyB = `ratelimit:test:${Date.now()}:tenant-B`;

    for (let i = 0; i < 5; i++) {
      expect((await checkRateLimit(redis, keyA, config)).allowed).toBe(true);
    }
    expect((await checkRateLimit(redis, keyA, config)).allowed).toBe(false);

    // WHY: B has its own bucket — A's exhaustion must not bleed across.
    expect((await checkRateLimit(redis, keyB, config)).allowed).toBe(true);
  });
});
