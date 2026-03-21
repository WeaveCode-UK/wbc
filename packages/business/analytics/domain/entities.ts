export type ABCClassification = 'A' | 'B' | 'C';

export interface DashboardMetrics {
  salesThisMonth: number;
  revenueThisMonth: number;
  totalClients: number;
  pendingReminders: number;
  pendingPayments: number;
  overduePayments: number;
  stockAlerts: number;
  appointmentsToday: number;
}

export interface ClientEngagement {
  clientId: string;
  clientName: string;
  totalPurchases: number;
  totalSpent: number;
  lastPurchaseDate: Date | null;
  daysSinceLastPurchase: number | null;
  classification: ABCClassification;
  engagementScore: number;
}

export interface ProductRanking {
  productId: string;
  productName: string;
  brandName: string;
  totalSold: number;
  totalRevenue: number;
}

export interface SalesGoal {
  target: number;
  current: number;
  percentage: number;
  daysRemaining: number;
  dailyNeeded: number;
}

export interface SeasonalityData {
  month: number;
  year: number;
  revenue: number;
  sales: number;
}
