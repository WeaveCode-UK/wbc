import { prisma } from '@wbc/db';

export async function getFinanceDashboard(tenantId: string, period?: string) {
  const now = new Date();
  const currentPeriod = period ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [year, month] = currentPeriod.split('-').map(Number);

  if (!year || !month) {
    return { revenue: 0, expenses: 0, profit: 0, receivables: 0 };
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const [revenueResult, expensesResult, receivablesResult] = await Promise.all([
    prisma.sale.aggregate({
      where: { tenantId, status: { in: ['CONFIRMED', 'DELIVERED'] }, createdAt: { gte: startDate, lte: endDate } },
      _sum: { total: true },
    }),
    prisma.expense.aggregate({
      where: { tenantId, date: { gte: startDate, lte: endDate } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { status: 'PENDING', sale: { tenantId } },
      _sum: { amount: true },
    }),
  ]);

  const revenue = Number(revenueResult._sum.total ?? 0);
  const expenses = Number(expensesResult._sum.amount ?? 0);

  return {
    revenue,
    expenses,
    profit: revenue - expenses,
    receivables: Number(receivablesResult._sum.amount ?? 0),
  };
}
