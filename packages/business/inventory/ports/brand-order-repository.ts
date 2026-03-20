import type { BrandOrder, BrandOrderItem } from '../domain/entities';

export interface BrandOrderRepository {
  findById(tenantId: string, id: string): Promise<(BrandOrder & { items: BrandOrderItem[] }) | null>;
  list(tenantId: string, status?: string): Promise<BrandOrder[]>;
  create(data: { tenantId: string; brandId: string; items: Array<{ productName: string; quantity: number; unitCost: number }>; notes?: string }): Promise<BrandOrder>;
  updateStatus(tenantId: string, id: string, status: string, receivedAt?: Date): Promise<BrandOrder>;
}
