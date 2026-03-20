import type { Expense } from '../domain/entities';
import type { ExpenseRepository } from '../ports/expense-repository';
import { ExpenseNotFoundError } from '../domain/errors';

export async function listExpenses(tenantId: string, filters: { category?: string; page: number; limit: number }, expenseRepo: ExpenseRepository) {
  return expenseRepo.list(tenantId, filters);
}

export async function createExpense(data: { tenantId: string; description: string; amount: number; category?: string; date: Date }, expenseRepo: ExpenseRepository): Promise<Expense> {
  return expenseRepo.create(data);
}

export async function updateExpense(tenantId: string, id: string, data: Partial<Expense>, expenseRepo: ExpenseRepository): Promise<Expense> {
  const existing = await expenseRepo.findById(tenantId, id);
  if (!existing) throw new ExpenseNotFoundError(id);
  return expenseRepo.update(tenantId, id, data);
}

export async function deleteExpense(tenantId: string, id: string, expenseRepo: ExpenseRepository): Promise<void> {
  const existing = await expenseRepo.findById(tenantId, id);
  if (!existing) throw new ExpenseNotFoundError(id);
  await expenseRepo.delete(tenantId, id);
}
