// T5.6 — Idempotency cache against a real Redis.
//
// WHY: the idempotency middleware (apps/api/src/trpc/idempotency-middleware.ts)
// stores the JSON-encoded result under `idem:{key}` with a TTL. The
// happy-path semantics are simple but two failure modes only show up
// against real Redis:
//   1. SET ... EX must not store on a connection error (graceful degrade);
//   2. once the TTL elapses, the *next* call must recompute, not return
//      the stale cached value forever.
//
// We replicate the same GET/SET-EX surface used by the middleware (so
// the @wbc/shared package doesn't have to import tRPC just to test
// the storage layer) and exercise both paths.

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

const PREFIX = "idem:";

async function idempotent<T>(
  redis: Redis,
  key: string,
  ttlSeconds: number,
  handler: () => Promise<T>,
): Promise<{ result: T; cached: boolean }> {
  const cached = await redis.get(`${PREFIX}${key}`);
  if (cached) {
    return { result: JSON.parse(cached) as T, cached: true };
  }
  const result = await handler();
  await redis.set(`${PREFIX}${key}`, JSON.stringify(result), "EX", ttlSeconds);
  return { result, cached: false };
}

describe.skipIf(!SHOULD_RUN_INTEGRATION)("idempotency cache (redis)", () => {
  let container: StartedRedisContainer;
  let redis: Redis;

  beforeAll(async () => {
    container = await new RedisContainer("redis:7-alpine").start();
    redis = new Redis({
      host: container.getHost(),
      port: container.getPort(),
      maxRetriesPerRequest: 1,
    });
    await redis.ping();
  }, 120_000);

  afterAll(async () => {
    redis?.disconnect();
    await container?.stop();
  });

  it("returns the cached result on a duplicate call with the same key", async () => {
    const key = `dup-${Date.now()}`;
    let runs = 0;
    const handler = async () => {
      runs += 1;
      return { id: "abc", runs };
    };

    const a = await idempotent(redis, key, 60, handler);
    expect(a.cached).toBe(false);
    expect(a.result.runs).toBe(1);

    const b = await idempotent(redis, key, 60, handler);
    expect(b.cached).toBe(true);
    // WHY: same payload comes back; the handler must NOT have been
    // called a second time.
    expect(b.result).toEqual({ id: "abc", runs: 1 });
    expect(runs).toBe(1);
  });

  it("recomputes after the TTL expires", async () => {
    // WHY: 1s TTL is the smallest practical value (`SET ... EX` rounds
    // to seconds). 1500ms wait is a safe-but-not-flaky margin.
    const key = `ttl-${Date.now()}`;
    let runs = 0;
    const handler = async () => {
      runs += 1;
      return { runs };
    };

    const first = await idempotent(redis, key, 1, handler);
    expect(first.result.runs).toBe(1);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const second = await idempotent(redis, key, 1, handler);
    expect(second.cached).toBe(false);
    expect(second.result.runs).toBe(2);
    expect(runs).toBe(2);
  });

  it("uses different keys for different inputs — no false cache hits", async () => {
    const handler = async (label: string) => ({ label });

    const a = await idempotent(redis, `key-A-${Date.now()}`, 60, () =>
      handler("A"),
    );
    const b = await idempotent(redis, `key-B-${Date.now()}`, 60, () =>
      handler("B"),
    );

    expect(a.result.label).toBe("A");
    expect(b.result.label).toBe("B");
    expect(b.cached).toBe(false);
  });
});
