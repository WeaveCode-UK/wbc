import { prisma } from "@wbc/db";
import { createPushableNotification } from "./notification-fanout";

// Item 91 da spec / item 5 do handoff: detecta clientes que completam
// 1, 2, 5 ou 10 anos da primeira compra hoje e cria uma Notification
// pra consultora. Roda diariamente via cron-processor. Idempotente:
// ignora se já existe uma Notification do mesmo tipo+cliente em
// CLIENT_MILESTONE_<years> hoje.

const MILESTONE_YEARS = [1, 2, 5, 10] as const;

export interface MilestonesReport {
  scanned: number;
  created: number;
}

function sameMonthDay(a: Date, b: Date): boolean {
  return (
    a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate()
  );
}

export async function notifyClientMilestones(
  tenantId: string,
  now: Date = new Date(),
): Promise<MilestonesReport> {
  const clients = await prisma.client.findMany({
    where: {
      tenantId,
      isActive: true,
      isLead: false,
      firstPurchaseAt: { not: null },
    },
    select: { id: true, name: true, firstPurchaseAt: true },
  });

  let created = 0;
  const startOfDay = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  for (const client of clients) {
    const firstPurchase = client.firstPurchaseAt;
    if (!firstPurchase) continue;
    if (!sameMonthDay(firstPurchase, now)) continue;

    const yearsAsClient = now.getUTCFullYear() - firstPurchase.getUTCFullYear();
    if (
      !MILESTONE_YEARS.includes(
        yearsAsClient as (typeof MILESTONE_YEARS)[number],
      )
    ) {
      continue;
    }

    // Type carries clientId so the per-client dedupe is a single equality
    // lookup; the UI can render `type.startsWith("CLIENT_MILESTONE_")` and
    // route the click to /clients/<id>.
    const type = `CLIENT_MILESTONE_${client.id}_${yearsAsClient}Y`;
    const existing = await prisma.notification.findFirst({
      where: {
        tenantId,
        type,
        createdAt: { gte: startOfDay, lt: endOfDay },
      },
      select: { id: true },
    });
    if (existing) continue;

    const yearWord = yearsAsClient === 1 ? "ano" : "anos";
    await createPushableNotification({
      tenantId,
      type,
      title: `🥂 ${client.name} é cliente há ${yearsAsClient} ${yearWord}`,
      body: `Manda uma mensagem comemorando o marco com a ${client.name}.`,
    });
    created++;
  }

  return { scanned: clients.length, created };
}
