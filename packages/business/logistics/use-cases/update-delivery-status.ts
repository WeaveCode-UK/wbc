import type { DeliveryRepository } from '../ports/delivery-repository';
import type { DeliveryEntity, DeliveryStatus } from '../domain/entities';
import { DeliveryNotFoundError, InvalidStatusTransitionError } from '../domain/errors';

const VALID_TRANSITIONS: Record<string, string[]> = {
  CONFIRMED: ['SEPARATED', 'CANCELLED'],
  SEPARATED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

export async function updateDeliveryStatus(repo: DeliveryRepository, tenantId: string, deliveryId: string, newStatus: DeliveryStatus, trackingCode?: string): Promise<DeliveryEntity> {
  const delivery = await repo.findById(tenantId, deliveryId);
  if (!delivery) throw new DeliveryNotFoundError(deliveryId);
  const allowed = VALID_TRANSITIONS[delivery.status] ?? [];
  if (!allowed.includes(newStatus)) throw new InvalidStatusTransitionError(delivery.status, newStatus);
  const extra: { trackingCode?: string; deliveredAt?: Date } = {};
  if (trackingCode) extra.trackingCode = trackingCode;
  if (newStatus === 'DELIVERED') extra.deliveredAt = new Date();
  return repo.updateStatus(tenantId, deliveryId, newStatus, extra);
}
