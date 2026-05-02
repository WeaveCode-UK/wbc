import { prisma } from "@wbc/db";

// F11.E11: detect clients who have likely gone inactive and create
// reactivation notifications + opportunities for the consultora.
//
// Heuristic per client: compute the average cycle in days between
// consecutive sales (need at least two sales to have a cycle); flag
// when `today - lastPurchase > avgCycle * 1.5`. Tenants whose data is
// thinner (only one sale) are flagged after a fallback 90-day window.
//
// Idempotency: a client already flagged in the last 30 days is
// skipped, so the cron can safely run daily without spamming
// notifications.

const FALLBACK_INACTIVE_DAYS = 90;
const REACTIVATION_TYPE = "client.reactivation";
const RENOTIFY_INTERVAL_DAYS = 30;

export interface InactiveClientReport {
  flagged: number;
  skipped: number;
  scanned: number;
}

export async function flagInactiveClients(
  tenantId: string,
): Promise<InactiveClientReport> {
  const now = new Date();
  const renotifyCutoff = new Date(
    now.getTime() - RENOTIFY_INTERVAL_DAYS * 24 * 60 * 60 * 1000,
  );

  const clients = await prisma.client.findMany({
    where: { tenantId, isActive: true, isLead: false },
    select: { id: true, name: true },
  });

  let flagged = 0;
  let skipped = 0;

  for (const client of clients) {
    const sales = await prisma.sale.findMany({
      where: { tenantId, clientId: client.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { createdAt: true },
    });
    if (sales.length === 0) {
      skipped++;
      continue;
    }

    const lastPurchase = sales[0]!.createdAt;
    const daysSince =
      (now.getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24);

    let threshold: number;
    if (sales.length >= 2) {
      let totalGap = 0;
      for (let i = 0; i < sales.length - 1; i++) {
        const gapMs =
          sales[i]!.createdAt.getTime() - sales[i + 1]!.createdAt.getTime();
        totalGap += gapMs / (1000 * 60 * 60 * 24);
      }
      const avgCycle = totalGap / (sales.length - 1);
      threshold = avgCycle * 1.5;
    } else {
      threshold = FALLBACK_INACTIVE_DAYS;
    }

    if (daysSince <= threshold) {
      skipped++;
      continue;
    }

    // Already notified recently? Skip — keeps cron idempotent.
    const recent = await prisma.notification.findFirst({
      where: {
        tenantId,
        type: REACTIVATION_TYPE,
        body: { contains: client.id },
        createdAt: { gt: renotifyCutoff },
      },
      select: { id: true },
    });
    if (recent) {
      skipped++;
      continue;
    }

    await prisma.notification.create({
      data: {
        tenantId,
        type: REACTIVATION_TYPE,
        title: `${client.name} pode estar sumindo`,
        body: `Sem compras há ${Math.floor(daysSince)} dias. Que tal mandar uma mensagem? client:${client.id}`,
      },
    });
    flagged++;
  }

  return { flagged, skipped, scanned: clients.length };
}
