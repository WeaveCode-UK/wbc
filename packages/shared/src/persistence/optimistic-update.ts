// ACH-003 dados-persistencia: optimistic locking helper.
//
// A `read → validate → write` sequence under the default READ COMMITTED
// isolation can lose updates when two workers interleave:
//
//   W1 read v=3, usage=5  → W2 read v=3, usage=5
//   W1 checks limit (ok)  → W2 checks limit (ok)
//   W1 write v=4, usage=6 → W2 write v=4, usage=6  ← bug: should be 7
//
// Optimistic locking swaps that for:
//
//   W1 read v=3, usage=5 → W2 read v=3, usage=5
//   W1 updates WHERE version=3 SET version=4, usage=6  (1 row)
//   W2 updates WHERE version=3 SET version=4, usage=6  (0 rows) → throw
//   W2 retries: reads v=4, usage=6, updates to v=5, usage=7
//
// The helper runs `attemptUpdate` (which must perform an UPDATE …
// WHERE version = expectedVersion … and return the affected-row count)
// with a small retry loop. After `maxRetries` collisions it throws
// `OptimisticLockError`; callers decide whether to surface the error
// to the user or keep retrying.

const DEFAULT_MAX_RETRIES = 3;

export class OptimisticLockError extends Error {
  constructor(
    public readonly entity: string,
    public readonly attempts: number,
  ) {
    super(`Optimistic lock conflict on ${entity} after ${attempts} attempts`);
    this.name = "OptimisticLockError";
  }
}

export interface OptimisticAttempt<T> {
  /** Current version read from the row; pass back in the UPDATE WHERE. */
  currentVersion: number;
  /** Entity state at the start of this attempt. */
  state: T;
}

export interface OptimisticAttemptResult<T> {
  /** The serialised state after this attempt's UPDATE succeeded. */
  value: T;
  /** `true` if the UPDATE affected a row; `false` on version mismatch. */
  committed: boolean;
}

/**
 * Run `attempt` up to `maxRetries` times. Each call receives the
 * current state; it must issue its UPDATE with a WHERE clause that
 * includes `version = currentVersion` and a SET that bumps
 * `version = version + 1`. Returning `committed: false` tells the
 * helper to re-read and try again.
 */
export async function optimisticUpdate<T>(
  entity: string,
  read: () => Promise<OptimisticAttempt<T>>,
  attempt: (input: OptimisticAttempt<T>) => Promise<OptimisticAttemptResult<T>>,
  maxRetries: number = DEFAULT_MAX_RETRIES,
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const input = await read();
      const result = await attempt(input);
      if (result.committed) return result.value;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError ?? new OptimisticLockError(entity, maxRetries + 1);
}
