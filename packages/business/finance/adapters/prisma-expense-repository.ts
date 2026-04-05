import { prisma } from '@wbc/db';
import { buildTenantWhere, paginatedQuery } from '@wbc/shared';
import type { ExpenseRepository } from '../ports/expense-repository';
import type { Expense } from '../domain/entities';

export class PrismaExpenseRepository implements ExpenseRepository {
  async findById(tenantId: string, id: string): Promise<Expense | null> {
    const expense = await prisma.expense.findFirst({ where: { id, tenantId } });
    return expense ? { ...expense, amount: Number(expense.amount) } : null;
  }

  async list(tenantId: string, filters: { category?: string; page: number; limit: number }) {
    const where = buildTenantWhere(tenantId, { category: filters.category });
    const result = await paginatedQuery<Record<string, unknown>>(
      prisma.expense as never,
      where,
      { page: filters.page, limit: filters.limit },
      { date: 'desc' },
    );
    return {
      data: result.data.map((e) => ({ ...e, amount: Number(e.amount) })) as Expense[],
      total: result.total,
    };
  }

  async create(data: { tenantId: string; description: string; amount: number; category?: string; date: Date }): Promise<Expense> {
    const expense = await prisma.expense.create({ data });
    return { ...expense, amount: Number(expense.amount) } as Expense;
  }

  async update(tenantId: string, id: string, data: Partial<Expense>): Promise<Expense> {
    const expense = await prisma.expense.update({ where: { id }, data });
    return { ...expense, amount: Number(expense.amount) } as Expense;
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await prisma.expense.delete({ where: { id } });
  }

  async getTotalByPeriod(tenantId: string, period: string): Promise<number> {
    const [year, month] = period.split('-').map(Number);
    if (!year || !month) return 0;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    const result = await prisma.expense.aggregate({
      where: { tenantId, date: { gte: startDate, lte: endDate } },
      _sum: { amount: true },
    });
    return Number(result._sum.amount ?? 0);
  }
}
