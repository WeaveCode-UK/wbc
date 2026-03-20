import type { Cashback } from '../domain/entities';

export interface CashbackRepository {
  getBalance(tenantId: string, clientId: string): Promise<{ available: number; expiring: Cashback[] }>;
  create(data: { tenantId: string; clientId: string; amount: number; expiresAt: Date; originSaleId: string }): Promise<Cashback>;
  use(tenantId: string, clientId: string, amount: number): Promise<void>;
}
