import { prisma } from "@wbc/db";

// Item 58 da spec / item 13 do handoff: lembrete de reposição usando a
// média real por par (cliente × produto). O cron build-restock-reminders
// já calcula um ciclo por cliente; este use-case complementa com um
// ciclo por produto, criando reminders específicos quando o cliente
// está no ponto de recompra de um item conhecido.
//
// Fonte: SaleItem joined com Sale.createdAt. Considera apenas pares com
// pelo menos 2 compras do mesmo produto (1 compra não dá amostra de
// cadência). Idempotência: dedupe por (clientId, type=RESTOCK_PRODUCT,
// triggerDate, message contains productId).

interface ProductCadenceRow {
  clientId: string;
  productId: string;
  productName: string;
  saleDates: Date[];
}

const MIN_SAMPLES = 2;
const MAX_LOOKBACK_PER_PAIR = 12;

export interface RestockPerProductReport {
  scanned: number;
  created: number;
  skipped: number;
}

export function avgGapDays(dates: Date[]): number {
  if (dates.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < dates.length - 1; i++) {
    total +=
      (dates[i]!.getTime() - dates[i + 1]!.getTime()) / (1000 * 60 * 60 * 24);
  }
  return total / (dates.length - 1);
}

export async function buildRestockRemindersPerProduct(
  tenantId: string,
  now: Date = new Date(),
): Promise<RestockPerProductReport> {
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );

  // Pull every SaleItem for the tenant (only CONFIRMED/DELIVERED sales)
  // joined with the sale createdAt. Mid-volume tenants are fine; for
  // big multi-tenants this can move to a Prisma raw groupBy.
  const items = await prisma.saleItem.findMany({
    where: {
      sale: {
        tenantId,
        status: { in: ["CONFIRMED", "DELIVERED"] },
      },
    },
    select: {
      productId: true,
      product: { select: { name: true } },
      sale: { select: { clientId: true, createdAt: true } },
    },
  });

  // Group by (clientId, productId) → ordered desc by sale date.
  const grouped = new Map<string, ProductCadenceRow>();
  for (const item of items) {
    const clientId = item.sale.clientId;
    const productId = item.productId;
    const key = `${clientId}|${productId}`;
    const row = grouped.get(key) ?? {
      clientId,
      productId,
      productName: item.product?.name ?? "produto",
      saleDates: [],
    };
    row.saleDates.push(item.sale.createdAt);
    grouped.set(key, row);
  }

  let created = 0;
  let skipped = 0;
  const scanned = grouped.size;

  for (const row of grouped.values()) {
    const dates = row.saleDates
      .sort((a, b) => b.getTime() - a.getTime())
      .slice(0, MAX_LOOKBACK_PER_PAIR);
    if (dates.length < MIN_SAMPLES) {
      skipped++;
      continue;
    }

    const avg = avgGapDays(dates);
    if (avg <= 0) {
      skipped++;
      continue;
    }
    const lastPurchase = dates[0]!;
    const triggerDay = new Date(lastPurchase);
    triggerDay.setDate(triggerDay.getDate() + Math.round(avg));
    if (triggerDay > today) {
      skipped++;
      continue;
    }

    // Dedup: a single reminder of the new type per (client, product, day).
    const existing = await prisma.reminder.findFirst({
      where: {
        tenantId,
        clientId: row.clientId,
        type: "RESTOCK",
        status: "PENDING",
        triggerDate: today,
        message: { contains: row.productId },
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
        clientId: row.clientId,
        type: "RESTOCK",
        triggerDate: today,
        message: `Reposição prevista de ${row.productName} (ciclo médio ${Math.round(avg)} dias) [${row.productId}]`,
      },
    });
    created++;
  }

  return { scanned, created, skipped };
}
