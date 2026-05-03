import type { FinanceRepository } from "../ports/finance-repository";

// Period semantics:
//   - "YYYY-MM"  → that calendar month
//   - "YYYY"     → full calendar year
//   - "all"      → no date bound (since the epoch up to now)
//   - undefined  → trailing 12 months ending today. The previous default
//     was the current calendar month; that produced "expenses = 0" right
//     after the 1st of the month or whenever data only exists in earlier
//     months (e.g. a fresh seed). The 12-month window is a saner default
//     while we don't have a period selector in the UI.
export async function getFinanceDashboard(
  tenantId: string,
  period: string | undefined,
  repo: FinanceRepository,
) {
  const now = new Date();
  const endDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
  );

  if (period === "all") {
    return repo.getDashboard(tenantId, new Date(0), endDate);
  }

  if (period && /^\d{4}$/.test(period)) {
    const year = Number(period);
    return repo.getDashboard(
      tenantId,
      new Date(year, 0, 1),
      new Date(year, 11, 31, 23, 59, 59),
    );
  }

  if (period && /^\d{4}-\d{2}$/.test(period)) {
    const [year, month] = period.split("-").map(Number);
    if (!year || !month) {
      return { revenue: 0, expenses: 0, profit: 0, receivables: 0 };
    }
    return repo.getDashboard(
      tenantId,
      new Date(year, month - 1, 1),
      new Date(year, month, 0, 23, 59, 59),
    );
  }

  // Default: trailing 12 months (today minus 11 months → today).
  const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  return repo.getDashboard(tenantId, startDate, endDate);
}
