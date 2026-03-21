export type DeliveryMethod = 'PICKUP' | 'DELIVERY' | 'SHIPPING';
export type DeliveryStatus = 'CONFIRMED' | 'SEPARATED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface DeliveryEntity {
  id: string;
  tenantId: string;
  saleId: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  address: string | null;
  method: DeliveryMethod;
  status: DeliveryStatus;
  trackingCode: string | null;
  estimatedDate: Date | null;
  deliveredAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
