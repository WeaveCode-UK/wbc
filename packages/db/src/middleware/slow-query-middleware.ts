// ACH-030 performance-escalabilidade: log Prisma queries that
// exceed a threshold, in production too, so N+1 and missing-index
// patterns surface without anyone manually tailing `pg_stat_statements`.
//
// Dev already gets `log: 'query'` (every query printed); the noise
// level makes that useless in prod. This middleware samples slow
// queries and emits a structured warn with model + action +
// duration — queryable in the log aggregator, and easy to correlate
// with a traced request id.

import type { Prisma } from "@prisma/client";

const DEFAULT_THRESHOLD_MS = 500;

export interface SlowQueryMiddlewareOptions {
  /** Queries slower than this (ms) are logged. Default 500. */
  thresholdMs?: number;
  /** 0.0–1.0. Fraction of slow queries actually logged. Default 1.0 (all). */
  sampleRate?: number;
  /** Logger callback — injected so the middleware doesn't pull pino into @wbc/db. */
  warn: (fields: Record<string, unknown>, msg: string) => void;
}

export function createSlowQueryMiddleware(
  opts: SlowQueryMiddlewareOptions,
): Prisma.Middleware {
  const thresholdMs = opts.thresholdMs ?? DEFAULT_THRESHOLD_MS;
  const sampleRate = opts.sampleRate ?? 1.0;
  return async (params, next) => {
    const start = performance.now();
    try {
      return await next(params);
    } finally {
      const durationMs = performance.now() - start;
      if (durationMs >= thresholdMs && Math.random() < sampleRate) {
        opts.warn(
          {
            model: params.model,
            action: params.action,
            durationMs: Math.round(durationMs),
            // `args` can contain PII; log only the action-level shape.
            argsKeys: params.args ? Object.keys(params.args) : [],
          },
          "Slow Prisma query (ACH-030 perf)",
        );
      }
    }
  };
}
