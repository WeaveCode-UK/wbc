import { prisma } from '@wbc/db';
import type { AnalyticsRepository, DashboardData, SalesStats, ProductRankingItem, ClientEngagement } from '../ports/analytics-repository';

export class PrismaAnalyticsRepository implements AnalyticsRepository {
  async getDashboard(tenantId: string): Promise<DashboardData> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [salesThisMonth, revenueResult, pendingReminders, upcomingAppointments] = await Promise.all([
      prisma.sale.count({
        where: { tenantId, status: { in: ['CONFIRMED', 'DELIVERED'] }, createdAt: { gte: startOfMonth, lte: endOfMonth } },
      }),
      prisma.sale.aggregate({
        where: { tenantId, status: { in: ['CONFIRMED', 'DELIVERED'] }, createdAt: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { total: true },
      }),
      prisma.reminder.count({ where: { tenantId, status: 'PENDING' } }),
      prisma.appointment.count({
        where: { tenantId, startsAt: { gte: now, lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) } },
      }),
    ]);

    return {
      salesThisMonth,
      revenue: Number(revenueResult._sum.total ?? 0),
      pendingReminders,
      upcomingAppointments,
      alerts: [],
    };
  }

  async getSalesStats(tenantId: string): Promise<SalesStats> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const sales = await prisma.sale.findMany({
      where: { tenantId, status: { in: ['CONFIRMED', 'DELIVERED'] }, createdAt: { gte: startOfMonth } },
      select: { total: true },
    });

    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total), 0);
    const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

    return { totalSales, totalRevenue, avgTicket };
  }

  async getProductRanking(tenantId: string, limit: number): Promise<ProductRankingItem[]> {
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

  async getClientEngagement(tenantId: string, clientId: string): Promise<ClientEngagement> {
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
      breakdown: { salesCount, totalSpent: Number(totalSpent._sum.total ?? 0), daysSinceLastPurchase },
    };
  }

  async calculateABCClassification(tenantId: string): Promise<{ updated: number }> {
    const clients = await prisma.client.findMany({
      where: { tenantId, isLead: false },
      include: { sales: { where: { status: { in: ['CONFIRMED', 'DELIVERED'] } }, select: { total: true } } },
    });

    const sorted = clients
      .map((c) => ({ id: c.id, totalSpent: c.sales.reduce((sum, s) => sum + Number(s.total), 0) }))
      .sort((a, b) => b.totalSpent - a.totalSpent);

    const total = sorted.length;
    for (let i = 0; i < sorted.length; i++) {
      const percentile = (i + 1) / total;
      const classification = percentile <= 0.2 ? 'A' : percentile <= 0.5 ? 'B' : 'C';
      await prisma.client.update({ where: { id: sorted[i]!.id }, data: { classification } });
    }

    return { updated: sorted.length };
  }
}
