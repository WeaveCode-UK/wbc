// ACH-017 dados-persistencia: DLQ archive + depth alert.
//
// Before this, the outbox's FAILED / DLQ rows grew unbounded — nothing
// archived them, nothing paged ops when the depth crossed a threshold,
// so a chronic failure mode only showed up when someone manually
// inspected Redis / Postgres.
//
// This module runs two jobs on the same cadence as the other outbox
// janitors (cleanup, scanner):
//
//   1. `archiveDlqEntriesOlderThan(days)` — deletes FAILED/DLQ rows
//      older than `days` (default 90). The original row has already
//      been escalated and logged by the DLQ processor; the DB row
//      past 90 days is noise.
//   2. `reportDlqDepth(threshold)` — emits a structured warn when the
//      count of FAILED+DLQ rows crosses a threshold. The DLQ processor
//      (ACH-020 apis-integracoes) forwards these warns to Sentry / Slack
//      when the fanout hooks are configured.

import { prisma } from "@wbc/db";
import { logger } from "../lib/logger";

const DEFAULT_ARCHIVE_DAYS = 90;
const DEFAULT_DEPTH_THRESHOLD = 100;

export async function archiveDlqEntriesOlderThan(
  days: number = DEFAULT_ARCHIVE_DAYS,
): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const result = await prisma.outboxEvent.deleteMany({
    where: {
      status: { in: ["FAILED", "DLQ"] },
      createdAt: { lt: cutoff },
    },
  });

  if (result.count > 0) {
    logger.info(
      { count: result.count, retentionDays: days },
      "DLQ archive: deleted expired FAILED/DLQ events",
    );
  }
  return result.count;
}

export async function reportDlqDepth(
  threshold: number = DEFAULT_DEPTH_THRESHOLD,
): Promise<number> {
  const [failed, dlq] = await Promise.all([
    prisma.outboxEvent.count({ where: { status: "FAILED" } }),
    prisma.outboxEvent.count({ where: { status: "DLQ" } }),
  ]);
  const total = failed + dlq;

  if (total >= threshold) {
    logger.warn(
      {
        failed,
        dlq,
        total,
        threshold,
      },
      "DLQ depth exceeded threshold — see docs/architecture/dlq-replay.md",
    );
  }
  return total;
}
