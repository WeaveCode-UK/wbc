import { prisma } from "@wbc/db";
import type {
  AnalyticsRepository,
  DashboardData,
  SalesStats,
  ProductRankingItem,
  ClientEngagement,
} from "../ports/analytics-repository";
import { MS_PER_DAY, DAYS_IN_WEEK } from "../domain/constants";
import {
  computeAvgTicket,
  computeDaysSince,
  computeEngagementScore,
  classifyABC,
} from "../domain/value-objects";

export class PrismaAnalyticsRepository implements AnalyticsRepository {
  async getDashboard(tenantId: string): Promise<DashboardData> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    const [
      salesThisMonth,
      revenueResult,
      pendingReminders,
      upcomingAppointments,
    ] = await Promise.all([
      prisma.sale.count({
        where: {
          tenantId,
          status: { in: ["CONFIRMED", "DELIVERED"] },
          createdAt: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
      prisma.sale.aggregate({
        where: {
          tenantId,
          status: { in: ["CONFIRMED", "DELIVERED"] },
          createdAt: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { total: true },
      }),
      prisma.reminder.count({ where: { tenantId, status: "PENDING" } }),
      prisma.appointment.count({
        where: {
          tenantId,
          startsAt: {
            gte: now,
            lte: new Date(now.getTime() + DAYS_IN_WEEK * MS_PER_DAY),
          },
        },
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
    const where = {
      tenantId,
      status: { in: ["CONFIRMED" as const, "DELIVERED" as const] },
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
      where: { sale: { tenantId, status: { in: ["CONFIRMED", "DELIVERED"] } } },
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
          status: { in: ["CONFIRMED", "DELIVERED"] },
        },
      }),
      prisma.sale.aggregate({
        where: {
          tenantId,
          clientId,
          status: { in: ["CONFIRMED", "DELIVERED"] },
        },
        _sum: { total: true },
      }),
      prisma.sale.findFirst({
        where: {
          tenantId,
          clientId,
          status: { in: ["CONFIRMED", "DELIVERED"] },
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

    const daysSinceLastPurchase = computeDaysSince(lastSale?.createdAt);
    const { score } = computeEngagementScore(salesCount, daysSinceLastPurchase);

    return {
      score,
      breakdown: {
        salesCount,
        totalSpent: Number(totalSpent._sum.total ?? 0),
        daysSinceLastPurchase,
      },
    };
  }

  async calculateABCClassification(
    tenantId: string,
  ): Promise<{ updated: number }> {
    const clients = await prisma.client.findMany({
      where: { tenantId, isLead: false },
      include: {
        sales: {
          where: { status: { in: ["CONFIRMED", "DELIVERED"] } },
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
