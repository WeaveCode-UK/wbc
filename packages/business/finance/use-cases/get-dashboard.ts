import type { FinanceRepository } from '../ports/finance-repository';

export async function getFinanceDashboard(tenantId: string, period: string | undefined, repo: FinanceRepository) {
  const now = new Date();
  const currentPeriod = period ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [year, month] = currentPeriod.split('-').map(Number);

  if (!year || !month) {
    return { revenue: 0, expenses: 0, profit: 0, receivables: 0 };
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  return repo.getDashboard(tenantId, startDate, endDate);
}
