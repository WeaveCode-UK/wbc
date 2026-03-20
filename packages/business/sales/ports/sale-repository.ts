import type { Sale, SaleItem } from '../domain/entities';

export interface SaleRepository {
  findById(tenantId: string, id: string): Promise<(Sale & { items: SaleItem[] }) | null>;
  list(tenantId: string, filters: { status?: string; clientId?: string; page: number; limit: number }): Promise<{ data: Sale[]; total: number }>;
  create(data: { tenantId: string; clientId: string; items: Array<{ productId: string; quantity: number; unitPrice: number }>; paymentMethod?: string; discount?: number; cashbackUsed?: number; campaignId?: string; notes?: string }): Promise<Sale>;
  updateStatus(tenantId: string, id: string, status: string): Promise<Sale>;
  delete(tenantId: string, id: string): Promise<void>;
}
