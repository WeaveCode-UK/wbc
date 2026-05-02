import { prisma } from "@wbc/db";
import { createPushableNotification } from "@wbc/business/schedule/use-cases/notification-fanout";

// F11.E12: scan for cashback rows that expire within the next N days
// (default 7) and create a notification per (tenant, client) so the
// consultora can nudge the customer. Idempotent — already-notified
// (tenant, client) pairs in the last 7 days are skipped.

const DEFAULT_LOOKAHEAD_DAYS = 7;
const RENOTIFY_INTERVAL_DAYS = 7;
const NOTIFICATION_TYPE = "client.cashback_expiring";

export interface ExpiringCashbackReport {
  scanned: number;
  flagged: number;
  skipped: number;
}

export async function flagExpiringCashbacks(
  tenantId: string,
  lookaheadDays = DEFAULT_LOOKAHEAD_DAYS,
): Promise<ExpiringCashbackReport> {
  const now = new Date();
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + lookaheadDays);
  const renotifyCutoff = new Date(
    now.getTime() - RENOTIFY_INTERVAL_DAYS * 24 * 60 * 60 * 1000,
  );

  const cashbacks = await prisma.cashback.findMany({
    where: {
      tenantId,
      expiresAt: { gte: now, lte: horizon },
    },
    select: {
      id: true,
      clientId: true,
      amount: true,
      usedAmount: true,
      expiresAt: true,
      client: { select: { name: true } },
    },
  });

  let flagged = 0;
  let skipped = 0;
  // Aggregate by client so a customer with three expiring cashbacks
  // gets one notification, not three.
  const byClient = new Map<
    string,
    {
      clientName: string;
      total: number;
      expiresAt: Date;
    }
  >();
  for (const cb of cashbacks) {
    const remaining = Number(cb.amount) - Number(cb.usedAmount);
    if (remaining <= 0) continue;
    const existing = byClient.get(cb.clientId);
    if (!existing) {
      byClient.set(cb.clientId, {
        clientName: cb.client.name,
        total: remaining,
        expiresAt: cb.expiresAt,
      });
    } else {
      existing.total += remaining;
      if (cb.expiresAt < existing.expiresAt) existing.expiresAt = cb.expiresAt;
    }
  }

  for (const [clientId, info] of byClient.entries()) {
    const recent = await prisma.notification.findFirst({
      where: {
        tenantId,
        type: NOTIFICATION_TYPE,
        body: { contains: clientId },
        createdAt: { gt: renotifyCutoff },
      },
      select: { id: true },
    });
    if (recent) {
      skipped++;
      continue;
    }
    const formatted = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(info.total);
    await createPushableNotification({
      tenantId,
      type: NOTIFICATION_TYPE,
      title: `${info.clientName} — cashback de ${formatted} vai expirar`,
      body: `${formatted} expira em ${info.expiresAt.toISOString().slice(0, 10)}. client:${clientId}`,
    });
    flagged++;
  }

  return { scanned: cashbacks.length, flagged, skipped };
}
