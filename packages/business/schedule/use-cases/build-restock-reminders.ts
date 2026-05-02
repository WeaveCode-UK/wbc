import { prisma } from "@wbc/db";

// F11.E13: per-client restock reminders driven by the real purchase
// cycle. For each active client with at least 2 sales we compute the
// average gap in days; if today >= lastPurchase + avgCycle a Reminder
// row is upserted (one per client per day). For clients with only one
// sale we fall back to a 60-day cycle.
//
// Idempotency: the (clientId, type, triggerDate) tuple is unique-ish —
// if a PENDING reminder already exists for today we skip. This makes
// the cron safe to run multiple times a day.

const FALLBACK_CYCLE_DAYS = 60;

export interface RestockReminderReport {
  scanned: number;
  created: number;
  skipped: number;
}

export async function buildRestockReminders(
  tenantId: string,
): Promise<RestockReminderReport> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const clients = await prisma.client.findMany({
    where: { tenantId, isActive: true, isLead: false },
    select: { id: true },
  });

  let created = 0;
  let skipped = 0;

  for (const client of clients) {
    const sales = await prisma.sale.findMany({
      where: { tenantId, clientId: client.id },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { createdAt: true },
    });
    if (sales.length === 0) {
      skipped++;
      continue;
    }
    const lastPurchase = sales[0]!.createdAt;

    let cycleDays: number;
    if (sales.length >= 2) {
      let totalGap = 0;
      for (let i = 0; i < sales.length - 1; i++) {
        totalGap +=
          (sales[i]!.createdAt.getTime() - sales[i + 1]!.createdAt.getTime()) /
          (1000 * 60 * 60 * 24);
      }
      cycleDays = totalGap / (sales.length - 1);
    } else {
      cycleDays = FALLBACK_CYCLE_DAYS;
    }

    const triggerDay = new Date(lastPurchase);
    triggerDay.setDate(triggerDay.getDate() + Math.round(cycleDays));
    if (triggerDay > today) {
      skipped++;
      continue;
    }

    const existing = await prisma.reminder.findFirst({
      where: {
        tenantId,
        clientId: client.id,
        type: "RESTOCK",
        status: "PENDING",
        triggerDate: today,
      },
      select: { id: true },
    });
    if (existing) {
      skipped++;
      continue;
    }

    await prisma.reminder.create({
      data: {
        tenantId,
        clientId: client.id,
        type: "RESTOCK",
        triggerDate: today,
        message: `Cliente está no ciclo de reposição (~${Math.round(cycleDays)} dias).`,
      },
    });
    created++;
  }

  return { scanned: clients.length, created, skipped };
}
