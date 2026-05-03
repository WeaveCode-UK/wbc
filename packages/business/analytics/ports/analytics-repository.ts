export interface DashboardData {
  salesThisMonth: number;
  revenue: number;
  pendingReminders: number;
  upcomingAppointments: number;
  alerts: string[];
}

export interface SalesStats {
  totalSales: number;
  totalRevenue: number;
  avgTicket: number;
}

export interface ProductRankingItem {
  productId: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface ClientEngagement {
  score: number; // 0..100
  breakdown: {
    salesCount: number;
    totalSpent: number;
    daysSinceLastPurchase: number;
    avgTicket: number;
    referralsCount: number;
  };
  components: {
    frequency: number; // 0..40
    recency: number; // 0..30
    ticket: number; // 0..20
    referrals: number; // 0..10
  };
}

export interface SeasonalityBucket {
  year: number;
  month: number;
  salesCount: number;
  revenue: number;
}

export interface AnalyticsRepository {
  getDashboard(tenantId: string): Promise<DashboardData>;
  getSalesStats(tenantId: string): Promise<SalesStats>;
  getProductRanking(
    tenantId: string,
    limit: number,
  ): Promise<ProductRankingItem[]>;
  getClientEngagement(
    tenantId: string,
    clientId: string,
  ): Promise<ClientEngagement>;
  calculateABCClassification(tenantId: string): Promise<{ updated: number }>;
  getSeasonality(
    tenantId: string,
    monthsBack: number,
  ): Promise<SeasonalityBucket[]>;
}
