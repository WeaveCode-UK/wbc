import { prisma } from "@wbc/db";
import { logger } from "../lib/logger";

// ACH-013 confiabilidade-resiliencia: retenção configurável via env.
// Default 30d (antes era hardcoded). Ver docs/DATA_RETENTION_POLICY.md
// para política formal e follow-up de cold storage.
function getRetentionDays(): number {
  const raw = Number.parseInt(process.env.OUTBOX_RETENTION_DAYS ?? "30", 10);
  if (!Number.isFinite(raw) || raw < 1) return 30;
  return raw;
}

// ACH-007 custos-finops: eventos FAILED que esgotaram retries também
// devem ser purgados para não crescer indefinidamente. Default 30d.
function getFailedRetentionDays(): number {
  const raw = Number.parseInt(
    process.env.OUTBOX_FAILED_RETENTION_DAYS ?? "30",
    10,
  );
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

// ACH-007 custos-finops: purga eventos FAILED com retries esgotados
// além da janela de retenção. Separado de PROCESSED para permitir
// configs independentes (FAILED costuma ser raro mas útil por mais
// tempo para auditoria).
export async function cleanupFailedOutboxEvents(): Promise<number> {
  const retentionDays = getFailedRetentionDays();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const result = await prisma.outboxEvent.deleteMany({
    where: {
      status: "FAILED",
      // `processedAt` aqui representa o último retry que falhou.
      processedAt: { lt: cutoffDate },
    },
  });

  if (result.count > 0) {
    logger.info(
      { count: result.count, retentionDays },
      "Outbox cleanup: deleted failed events (exhausted retries)",
    );
  }

  return result.count;
}
