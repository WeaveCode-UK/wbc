import { prisma } from "@wbc/db";
import { logger } from "../lib/logger";

// ACH-013 confiabilidade-resiliencia: retenção configurável via env.
// Default 30d (antes era hardcoded). Ver docs/RETENTION.md para
// política formal e follow-up de cold storage.
function getRetentionDays(): number {
  const raw = Number.parseInt(process.env.OUTBOX_RETENTION_DAYS ?? "30", 10);
  if (!Number.isFinite(raw) || raw < 1) return 30;
  return raw;
}

export async function cleanupProcessedOutboxEvents(): Promise<number> {
  const retentionDays = getRetentionDays();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const result = await prisma.outboxEvent.deleteMany({
    where: {
      status: "PROCESSED",
      processedAt: { lt: cutoffDate },
    },
  });

  if (result.count > 0) {
    logger.info(
      { count: result.count, retentionDays },
      "Outbox cleanup: deleted processed events",
    );
  }

  return result.count;
}
