// ACH-006 apis-integracoes: canonical response shapes.
//
// Different procedures used to return different envelope shapes:
// `{ success: true }` here, a bare array there, an ad-hoc object with
// `whatsappLink` and `messageId` next to it. Consumers (mobile, web)
// had to memorise the per-route shape, and a SDK generator couldn't
// produce a single `Result<T>` discriminated union.
//
// Canonical shapes this module exports:
//
//   ok(data)          → { success: true, data }
//   fail(code, msg?)  → { success: false, error: { code, message? } }
//   itemOk(data)      → { data }              (queries that return one entity)
//   listOk(data, meta)→ { data, meta }        (queries that return a list; see ACH-007)
//
// The "canonical" here means *new code and migrated code*. A big-bang
// migration of every existing procedure isn't in scope — callers adopt
// these helpers as they touch each route. See `docs/architecture/api-
// responses.md` for the migration plan.

export interface MutationOk<T> {
  success: true;
  data: T;
}

export interface MutationFail {
  success: false;
  error: {
    code: string;
    message?: string;
  };
}

export type MutationResult<T> = MutationOk<T> | MutationFail;

export interface QueryItem<T> {
  data: T;
}

export interface QueryListMeta {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  /** ACH-007 apis-integracoes: cursor reserved for cursor-based lists. */
  nextCursor?: string;
}

export interface QueryList<T> {
  data: T[];
  meta: QueryListMeta;
}

export function ok<T>(data: T): MutationOk<T> {
  return { success: true, data };
}

export function fail(code: string, message?: string): MutationFail {
  return { success: false, error: message ? { code, message } : { code } };
}

export function itemOk<T>(data: T): QueryItem<T> {
  return { data };
}

export function listOk<T>(
  data: T[],
  params: { page: number; limit: number; total: number; nextCursor?: string },
): QueryList<T> {
  const hasMore = params.page * params.limit < params.total;
  return {
    data,
    meta: {
      page: params.page,
      limit: params.limit,
      total: params.total,
      hasMore,
      ...(params.nextCursor ? { nextCursor: params.nextCursor } : {}),
    },
  };
}
