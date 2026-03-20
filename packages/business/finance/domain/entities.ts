export interface Expense {
  id: string;
  tenantId: string;
  description: string;
  amount: number;
  category: string | null;
  date: Date;
  createdAt: Date;
}

export interface FinancialReport {
  id: string;
  tenantId: string;
  period: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  generatedAt: Date;
}

export function calculateMargin(costPrice: number, salePrice: number): { margin: number; percentage: number } {
  const margin = salePrice - costPrice;
  const percentage = salePrice > 0 ? (margin / salePrice) * 100 : 0;
  return { margin: Math.round(margin * 100) / 100, percentage: Math.round(percentage * 100) / 100 };
}

export function calculateGoalReverse(targetIncome: number, avgMarginPercentage: number): { requiredSales: number } {
  if (avgMarginPercentage <= 0) return { requiredSales: 0 };
  const requiredSales = targetIncome / (avgMarginPercentage / 100);
  return { requiredSales: Math.round(requiredSales * 100) / 100 };
}
