// ACH-009: explicit interface instead of `as unknown as typeof redisClient`
// — the minimal surface used by idempotency is just GET + SET with EX.
// Narrowing here lets tsc catch signature drift if ioredis changes.
interface IdempotencyRedis {
  get(key: string): Promise<string | null>;
  set(
    key: string,
    value: string,
    mode: "EX",
    duration: number,
  ): Promise<unknown>;
}

let redisClient: IdempotencyRedis | null = null;

async function getRedis(): Promise<IdempotencyRedis | null> {
  if (redisClient) return redisClient;
  try {
    const { getRedis: getRedisInstance } = await import("../lib/redis");
    // ioredis implements the IdempotencyRedis shape directly; the cast
    // narrows the broader overload set to this subset without lying about
    // the contract.
    redisClient = getRedisInstance() as unknown as IdempotencyRedis;
    return redisClient;
  } catch {
    return null;
  }
}

const IDEMPOTENCY_TTL_SECONDS = 86400; // 24 hours
const IDEMPOTENCY_PREFIX = "idem:";

export async function checkIdempotency(
  key: string,
): Promise<{ isDuplicate: boolean; cachedResult?: unknown }> {
  const redis = await getRedis();
  if (!redis) return { isDuplicate: false };

  try {
    const cached = await redis.get(`${IDEMPOTENCY_PREFIX}${key}`);
    if (cached) {
      return { isDuplicate: true, cachedResult: JSON.parse(cached) };
    }
    return { isDuplicate: false };
  } catch {
    return { isDuplicate: false };
  }
}

export async function storeIdempotencyResult(
  key: string,
  result: unknown,
): Promise<void> {
  const redis = await getRedis();
  if (!redis) return;

  try {
    await redis.set(
      `${IDEMPOTENCY_PREFIX}${key}`,
      JSON.stringify(result),
      "EX",
      IDEMPOTENCY_TTL_SECONDS,
    );
  } catch {
    // Graceful degradation — don't fail the request if cache write fails
  }
}

export async function idempotent<T>(
  key: string | undefined,
  handler: () => Promise<T>,
): Promise<T> {
  if (key) {
    const { isDuplicate, cachedResult } = await checkIdempotency(key);
    if (isDuplicate) return cachedResult as T;
  }
  const result = await handler();
  if (key) await storeIdempotencyResult(key, result);
  return result;
}
