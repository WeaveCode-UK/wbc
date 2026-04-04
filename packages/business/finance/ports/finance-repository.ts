export interface FinanceDashboard {
  revenue: number;
  expenses: number;
  profit: number;
  receivables: number;
}

export interface CACResult {
  totalMarketing: number;
  totalClients?: number;
  clientSales?: number;
  cac: number;
}

export interface FinanceRepository {
  getDashboard(tenantId: string, startDate: Date, endDate: Date): Promise<FinanceDashboard>;
  getCAC(tenantId: string, clientId?: string): Promise<CACResult>;
}
