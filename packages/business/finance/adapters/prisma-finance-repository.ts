import { prisma } from '@wbc/db';
import type { FinanceRepository, FinanceDashboard, CACResult } from '../ports/finance-repository';

export class PrismaFinanceRepository implements FinanceRepository {
  async getDashboard(tenantId: string, startDate: Date, endDate: Date): Promise<FinanceDashboard> {
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

  async getCAC(tenantId: string, clientId?: string): Promise<CACResult> {
    if (clientId) {
      const [expenses, salesCount] = await Promise.all([
        prisma.expense.aggregate({ where: { tenantId, category: 'marketing' }, _sum: { amount: true } }),
        prisma.sale.count({ where: { tenantId, clientId, status: { in: ['CONFIRMED', 'DELIVERED'] } } }),
      ]);
      const totalMarketing = Number(expenses._sum.amount ?? 0);
      return { totalMarketing, clientSales: salesCount, cac: salesCount > 0 ? totalMarketing / salesCount : 0 };
    }

    const [expenses, clientCount] = await Promise.all([
      prisma.expense.aggregate({ where: { tenantId, category: 'marketing' }, _sum: { amount: true } }),
      prisma.client.count({ where: { tenantId, isLead: false } }),
    ]);
    const totalMarketing = Number(expenses._sum.amount ?? 0);
    return { totalMarketing, totalClients: clientCount, cac: clientCount > 0 ? totalMarketing / clientCount : 0 };
  }
}
