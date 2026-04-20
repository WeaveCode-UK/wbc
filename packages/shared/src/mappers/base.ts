/**
 * Minimal helpers for the `toDomain` / `toPrisma` mapping pattern
 * (ACH-011 codigo-manutenibilidade, run 2026-04-18_21-45-58).
 *
 * Until we have code-gen mappers per entity, this at least gives the
 * adapters a shared vocabulary and one line to import. The real refactor
 * (a `BaseMapper<TDomain, TPersistence>` class with project/rehydrate)
 * is a per-module effort and lives in the per-entity follow-up tickets.
 */

/**
 * Returns an object with only the whitelisted fields present on `source`.
 * Copies over `undefined`/`null` as-is (useful when mapping nullable DB
 * columns onto optional domain fields).
 */
export function pickFields<T, K extends keyof T>(
  source: T,
  fields: readonly K[],
): Pick<T, K> {
  const out = {} as Pick<T, K>;
  for (const key of fields) {
    out[key] = source[key];
  }
  return out;
}

/** Same as pickFields but drops keys whose value is `undefined`. */
export function pickDefinedFields<T extends object, K extends keyof T>(
  source: T,
  fields: readonly K[],
): Partial<Pick<T, K>> {
  const out: Partial<Pick<T, K>> = {};
  for (const key of fields) {
    const value = source[key];
    if (value !== undefined) {
      out[key] = value;
    }
  }
  return out;
}
