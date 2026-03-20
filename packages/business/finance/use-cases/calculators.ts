import { calculateMargin, calculateGoalReverse } from '../domain/entities';
import { prisma } from '@wbc/db';

export function getMargin(costPrice: number, salePrice: number) {
  return calculateMargin(costPrice, salePrice);
}

export function getGoalReverse(targetIncome: number, avgMarginPercentage: number) {
  return calculateGoalReverse(targetIncome, avgMarginPercentage);
}

export async function getCAC(tenantId: string, clientId?: string) {
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
