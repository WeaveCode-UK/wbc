import type { DeliveryEntity } from '../domain/entities';

export interface ShippingLabel {
  recipientName: string;
  recipientPhone: string;
  address: string;
  trackingCode: string | null;
  method: string;
  notes: string | null;
}

export function generateShippingLabel(delivery: DeliveryEntity): ShippingLabel {
  return { recipientName: delivery.clientName, recipientPhone: delivery.clientPhone, address: delivery.address ?? 'Retirada no local', trackingCode: delivery.trackingCode, method: delivery.method, notes: delivery.notes };
}
