import { prisma } from "@wbc/db";
import type {
  AnalyticsRepository,
  DashboardData,
  SalesStats,
  ProductRankingItem,
  ClientEngagement,
  SeasonalityBucket,
  TemporalComparison,
} from "../ports/analytics-repository";
import { MS_PER_DAY, DAYS_IN_WEEK } from "../domain/constants";
import {
  computeAvgTicket,
  computeDaysSince,
  computeEngagementScoreV2,
  classifyABC,
} from "../domain/value-objects";
// ACH-012 revisor follow-up: reuse centralised status enum instead of
// hardcoding `["CONFIRMED","DELIVERED"]` in 8 spots.
import { COMPLETED_SALE_STATUSES } from "../../sales/domain/status";

// ACH-017: god-function split. Each metric has its own method so callers can
// cache individually; `getDashboard` just composes them.
function monthBounds(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
  };
}

export class PrismaAnalyticsRepository implements AnalyticsRepository {
  async getMonthlySalesCount(tenantId: string): Promise<number> {
    const { start, end } = monthBounds();
    return prisma.sale.count({
      where: {
        tenantId,
        status: { in: COMPLETED_SALE_STATUSES },
        createdAt: { gte: start, lte: end },
      },
    });
  }

  async getMonthlyRevenue(tenantId: string): Promise<number> {
    const { start, end } = monthBounds();
    const result = await prisma.sale.aggregate({
      where: {
        tenantId,
        status: { in: COMPLETED_SALE_STATUSES },
        createdAt: { gte: start, lte: end },
      },
      _sum: { total: true },
    });
    return Number(result._sum.total ?? 0);
  }

  async getPendingRemindersCount(tenantId: string): Promise<number> {
    return prisma.reminder.count({ where: { tenantId, status: "PENDING" } });
  }

  async getUpcomingAppointmentsCount(tenantId: string): Promise<number> {
    const now = new Date();
    return prisma.appointment.count({
      where: {
        tenantId,
        startsAt: {
          gte: now,
          lte: new Date(now.getTime() + DAYS_IN_WEEK * MS_PER_DAY),
        },
      },
    });
  }

  async getDashboard(tenantId: string): Promise<DashboardData> {
    const [salesThisMonth, revenue, pendingReminders, upcomingAppointments] =
      await Promise.all([
        this.getMonthlySalesCount(tenantId),
        this.getMonthlyRevenue(tenantId),
        this.getPendingRemindersCount(tenantId),
        this.getUpcomingAppointmentsCount(tenantId),
      ]);

    return {
      salesThisMonth,
      revenue,
      pendingReminders,
      upcomingAppointments,
      alerts: [],
    };
  }

  async getSalesStats(tenantId: string): Promise<SalesStats> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const where = {
      tenantId,
      status: { in: COMPLETED_SALE_STATUSES },
      createdAt: { gte: startOfMonth },
    };

    const [count, agg] = await Promise.all([
      prisma.sale.count({ where }),
      prisma.sale.aggregate({ where, _sum: { total: true } }),
    ]);

    const totalSales = count;
    const totalRevenue = Number(agg._sum.total ?? 0);
    const avgTicket = computeAvgTicket(totalRevenue, totalSales);

    return { totalSales, totalRevenue, avgTicket };
  }

  async getProductRanking(
    tenantId: string,
    limit: number,
  ): Promise<ProductRankingItem[]> {
    const items = await prisma.saleItem.groupBy({
      by: ["productId"],
      where: { sale: { tenantId, status: { in: COMPLETED_SALE_STATUSES } } },
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: limit,
    });

    return items.map((item) => ({
      productId: item.productId,
      totalQuantity: item._sum.quantity ?? 0,
      totalRevenue: Number(item._sum.subtotal ?? 0),
    }));
  }

  async getClientEngagement(
    tenantId: string,
    clientId: string,
  ): Promise<ClientEngagement> {
    const [salesCount, totalSpent, lastSale] = await Promise.all([
      prisma.sale.count({
        where: {
          tenantId,
          clientId,
          status: { in: COMPLETED_SALE_STATUSES },
        },
      }),
      prisma.sale.aggregate({
        where: {
          tenantId,
          clientId,
          status: { in: COMPLETED_SALE_STATUSES },
        },
        _sum: { total: true },
      }),
      prisma.sale.findFirst({
        where: {
          tenantId,
          clientId,
          status: { in: COMPLETED_SALE_STATUSES },
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

    const daysSinceLastPurchase = computeDaysSince(lastSale?.createdAt);
    const totalSpentValue = Number(totalSpent._sum.total ?? 0);
    const avgTicket = computeAvgTicket(totalSpentValue, salesCount);
    // Indicações por cliente ainda não têm fonte (Client não tem self-ref
    // referredById e Referral é entre tenants). Quando a fonte existir, basta
    // popular este campo — o cálculo já reserva 10 pontos pra ele.
    const referralsCount = 0;
    const { score, breakdown: components } = computeEngagementScoreV2({
      salesCount,
      daysSinceLastPurchase,
      avgTicket,
      referralsCount,
    });

    return {
      score,
      breakdown: {
        salesCount,
        totalSpent: totalSpentValue,
        daysSinceLastPurchase,
        avgTicket,
        referralsCount,
      },
      components,
    };
  }

  async getSeasonality(
    tenantId: string,
    monthsBack: number,
  ): Promise<SeasonalityBucket[]> {
    const now = new Date();
    const start = new Date(
      now.getFullYear(),
      now.getMonth() - monthsBack + 1,
      1,
    );
    const sales = await prisma.sale.findMany({
      where: {
        tenantId,
        status: { in: COMPLETED_SALE_STATUSES },
        createdAt: { gte: start },
      },
      select: { createdAt: true, total: true },
    });

    const buckets = new Map<string, SeasonalityBucket>();
    for (let i = 0; i < monthsBack; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      buckets.set(key, {
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        salesCount: 0,
        revenue: 0,
      });
    }

    for (const sale of sales) {
      const d = sale.createdAt;
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const bucket = buckets.get(key);
      if (!bucket) continue;
      bucket.salesCount += 1;
      bucket.revenue += Number(sale.total);
    }

    return Array.from(buckets.values()).sort(
      (a, b) =>
        new Date(a.year, a.month - 1, 1).getTime() -
        new Date(b.year, b.month - 1, 1).getTime(),
    );
  }

  async getTemporalComparison(tenantId: string): Promise<TemporalComparison> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
    );
    const lastYearStart = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    const lastYearEnd = new Date(
      now.getFullYear() - 1,
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    async function aggregate(start: Date, end: Date) {
      const where = {
        tenantId,
        status: { in: COMPLETED_SALE_STATUSES },
        createdAt: { gte: start, lte: end },
      };
      const [count, agg] = await Promise.all([
        prisma.sale.count({ where }),
        prisma.sale.aggregate({ where, _sum: { total: true } }),
      ]);
      return { salesCount: count, revenue: Number(agg._sum.total ?? 0) };
    }

    const [current, previousMonth, sameMonthLastYear] = await Promise.all([
      aggregate(monthStart, monthEnd),
      aggregate(prevMonthStart, prevMonthEnd),
      aggregate(lastYearStart, lastYearEnd),
    ]);

    const pctDelta = (cur: number, prev: number) =>
      prev > 0 ? ((cur - prev) / prev) * 100 : cur > 0 ? 100 : 0;

    return {
      current,
      previousMonth,
      sameMonthLastYear,
      deltaVsPreviousMonthPct: pctDelta(current.revenue, previousMonth.revenue),
      deltaVsLastYearPct: pctDelta(current.revenue, sameMonthLastYear.revenue),
    };
  }

  async calculateABCClassification(
    tenantId: string,
  ): Promise<{ updated: number }> {
    const clients = await prisma.client.findMany({
      where: { tenantId, isLead: false },
      include: {
        sales: {
          where: { status: { in: COMPLETED_SALE_STATUSES } },
          select: { total: true },
        },
      },
    });

    const spending = clients.map((c) => ({
      id: c.id,
      totalSpent: c.sales.reduce((sum, s) => sum + Number(s.total), 0),
    }));

    const { aIds, bIds, cIds } = classifyABC(spending);

    await prisma.$transaction([
      prisma.client.updateMany({
        where: { id: { in: aIds } },
        data: { classification: "A" },
      }),
      prisma.client.updateMany({
        where: { id: { in: bIds } },
        data: { classification: "B" },
      }),
      prisma.client.updateMany({
        where: { id: { in: cIds } },
        data: { classification: "C" },
      }),
    ]);

    return { updated: spending.length };
  }
}
