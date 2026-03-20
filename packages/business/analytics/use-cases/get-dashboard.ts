import { prisma } from '@wbc/db';

export async function getAnalyticsDashboard(tenantId: string) {
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
    alerts: [] as string[],
  };
}
