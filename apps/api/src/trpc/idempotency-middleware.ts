import { createHash } from "crypto";
import { createLogger } from "../lib/logger";

const idempotencyLogger = createLogger("idempotency");

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

/**
 * ACH-001 apis-integracoes: derive a deterministic idempotency key when
 * the client didn't send one, so a tCP retry doesn't duplicate a
 * create/confirm/send/mark mutation.
 *
 * The key is `{route}:{tenantId}:{sha256(canonical(input))}`. Same
 * route + same tenant + same input → same key → cache hit on retry.
 * Different input (even an added whitespace in a string field) → new
 * key → new execution, which is the safe default.
 *
 * This is a compatibility shim during the migration: once every caller
 * ships an explicit `idempotencyKey`, we flip to hard-reject mutations
 * that omit it (see `docs/architecture/api-idempotency.md`).
 *
 * review-fix ACH-001: the previous implementation passed
 * `Object.keys(input).sort()` as the `replacer` argument of
 * `JSON.stringify`. That argument is a property *allow-list* applied
 * at every nesting level — nested objects got all their keys filtered
 * out (e.g. `{ items: [{productName, quantity, unitCost}] }` serialized
 * as `{"items":[{}]}`), which made two completely different inventory
 * orders hash to the same key and silently "dedupe" real work. The fix
 * is a proper recursive canonicaliser that sorts keys at every level
 * and leaves arrays positional.
 */
function canonicaliseForHash(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(canonicaliseForHash);
  const sortedKeys = Object.keys(value as Record<string, unknown>).sort();
  const out: Record<string, unknown> = {};
  for (const k of sortedKeys) {
    out[k] = canonicaliseForHash((value as Record<string, unknown>)[k]);
  }
  return out;
}

export function deriveIdempotencyKey(
  route: string,
  tenantId: string,
  input: unknown,
): string {
  const canonical = JSON.stringify(canonicaliseForHash(input));
  const digest = createHash("sha256")
    .update(canonical)
    .digest("hex")
    .slice(0, 32);
  return `${route}:${tenantId}:${digest}`;
}

/**
 * Resolve the idempotency key for a mutation. Logs a structured warn
 * when the client didn't send one so the migration progress is
 * measurable in production (ACH-001).
 */
export function resolveIdempotencyKey(
  route: string,
  tenantId: string,
  input: { idempotencyKey?: string } | unknown,
): string {
  const fromInput =
    typeof input === "object" && input && "idempotencyKey" in input
      ? (input as { idempotencyKey?: unknown }).idempotencyKey
      : undefined;
  if (typeof fromInput === "string" && fromInput.length > 0) {
    return fromInput;
  }
  idempotencyLogger.warn(
    { route, tenantId },
    "Mutation missing idempotencyKey — derived from input hash (ACH-001 migration)",
  );
  return deriveIdempotencyKey(route, tenantId, input);
}

/**
 * Thin convenience wrapper so routers can write:
 *   idempotentRoute('auth.acceptInvite', ctx, input, () => uc.execute(...))
 * instead of threading `idempotent(resolveIdempotencyKey(...), ...)`
 * through every mutation.
 */
export function idempotentRoute<T>(
  route: string,
  tenantId: string,
  input: { idempotencyKey?: string } | unknown,
  handler: () => Promise<T>,
): Promise<T> {
  const key = resolveIdempotencyKey(route, tenantId, input);
  return idempotent(key, handler);
}
