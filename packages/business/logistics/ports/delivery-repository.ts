import type { DeliveryEntity, DeliveryStatus } from '../domain/entities';

export interface DeliveryRepository {
  findById(tenantId: string, deliveryId: string): Promise<DeliveryEntity | null>;
  findBySaleId(tenantId: string, saleId: string): Promise<DeliveryEntity | null>;
  findByStatus(tenantId: string, status: DeliveryStatus): Promise<DeliveryEntity[]>;
  findPendingToday(tenantId: string): Promise<DeliveryEntity[]>;
  list(tenantId: string, filters?: { status?: DeliveryStatus; clientId?: string }): Promise<DeliveryEntity[]>;
  create(data: Omit<DeliveryEntity, 'id' | 'deliveredAt' | 'createdAt' | 'updatedAt'>): Promise<DeliveryEntity>;
  updateStatus(tenantId: string, deliveryId: string, status: DeliveryStatus, extra?: { trackingCode?: string; deliveredAt?: Date }): Promise<DeliveryEntity>;
  delete(tenantId: string, deliveryId: string): Promise<void>;
}
