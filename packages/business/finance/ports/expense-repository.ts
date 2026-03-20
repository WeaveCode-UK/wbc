import type { Expense } from '../domain/entities';

export interface ExpenseRepository {
  findById(tenantId: string, id: string): Promise<Expense | null>;
  list(tenantId: string, filters: { category?: string; page: number; limit: number }): Promise<{ data: Expense[]; total: number }>;
  create(data: { tenantId: string; description: string; amount: number; category?: string; date: Date }): Promise<Expense>;
  update(tenantId: string, id: string, data: Partial<Expense>): Promise<Expense>;
  delete(tenantId: string, id: string): Promise<void>;
  getTotalByPeriod(tenantId: string, period: string): Promise<number>;
}
