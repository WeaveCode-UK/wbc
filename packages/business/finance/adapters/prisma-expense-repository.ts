import { prisma } from '@wbc/db';
import type { ExpenseRepository } from '../ports/expense-repository';
import type { Expense } from '../domain/entities';

export class PrismaExpenseRepository implements ExpenseRepository {
  async findById(tenantId: string, id: string): Promise<Expense | null> {
    const expense = await prisma.expense.findFirst({ where: { id, tenantId } });
    return expense ? { ...expense, amount: Number(expense.amount) } : null;
  }

  async list(tenantId: string, filters: { category?: string; page: number; limit: number }) {
    const where: Record<string, unknown> = { tenantId };
    if (filters.category) where.category = filters.category;
    const [data, total] = await Promise.all([
      prisma.expense.findMany({ where, skip: (filters.page - 1) * filters.limit, take: filters.limit, orderBy: { date: 'desc' } }),
      prisma.expense.count({ where }),
    ]);
    return { data: data.map((e) => ({ ...e, amount: Number(e.amount) })) as Expense[], total };
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
