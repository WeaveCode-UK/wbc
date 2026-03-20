import { prisma } from '@wbc/db';

export async function getSalesStats(tenantId: string, period?: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const sales = await prisma.sale.findMany({
    where: { tenantId, status: { in: ['CONFIRMED', 'DELIVERED'] }, createdAt: { gte: startOfMonth } },
    include: { items: true, client: { select: { id: true, name: true } } },
  });

  const totalSales = sales.length;
  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total), 0);
  const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

  return { totalSales, totalRevenue, avgTicket };
}

export async function getProductRanking(tenantId: string, limit: number = 10) {
  const items = await prisma.saleItem.groupBy({
    by: ['productId'],
    where: { sale: { tenantId, status: { in: ['CONFIRMED', 'DELIVERED'] } } },
    _sum: { quantity: true, subtotal: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: limit,
  });

  return items.map((item) => ({
    productId: item.productId,
    totalQuantity: item._sum.quantity ?? 0,
    totalRevenue: Number(item._sum.subtotal ?? 0),
  }));
}

export async function getClientEngagement(tenantId: string, clientId: string) {
  const [salesCount, totalSpent, lastSale] = await Promise.all([
    prisma.sale.count({ where: { tenantId, clientId, status: { in: ['CONFIRMED', 'DELIVERED'] } } }),
    prisma.sale.aggregate({
      where: { tenantId, clientId, status: { in: ['CONFIRMED', 'DELIVERED'] } },
      _sum: { total: true },
    }),
    prisma.sale.findFirst({
      where: { tenantId, clientId, status: { in: ['CONFIRMED', 'DELIVERED'] } },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),
  ]);

  const daysSinceLastPurchase = lastSale
    ? Math.floor((Date.now() - lastSale.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    : -1;

  const score = Math.min(100, salesCount * 10 + (daysSinceLastPurchase < 30 ? 30 : daysSinceLastPurchase < 60 ? 15 : 0));

  return {
    score,
    breakdown: {
      salesCount,
      totalSpent: Number(totalSpent._sum.total ?? 0),
      daysSinceLastPurchase,
    },
  };
}

export async function calculateABCClassification(tenantId: string) {
  const clients = await prisma.client.findMany({
    where: { tenantId, isLead: false },
    include: {
      sales: {
        where: { status: { in: ['CONFIRMED', 'DELIVERED'] } },
        select: { total: true },
      },
    },
  });

  const sorted = clients
    .map((c) => ({
      id: c.id,
      salesCount: c.sales.length,
      totalSpent: c.sales.reduce((sum, s) => sum + Number(s.total), 0),
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent);

  const total = sorted.length;
  const updates: Array<{ id: string; classification: 'A' | 'B' | 'C' }> = [];

  sorted.forEach((client, index) => {
    const percentile = (index + 1) / total;
    const classification = percentile <= 0.2 ? 'A' : percentile <= 0.5 ? 'B' : 'C';
    updates.push({ id: client.id, classification });
  });

  for (const update of updates) {
    await prisma.client.update({
      where: { id: update.id },
      data: { classification: update.classification },
    });
  }

  return { updated: updates.length };
}
