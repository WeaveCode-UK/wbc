import type { DeliveryRepository } from '../ports/delivery-repository';
import type { DeliveryEntity, DeliveryStatus } from '../domain/entities';

export async function listDeliveries(repo: DeliveryRepository, tenantId: string, filters?: { status?: DeliveryStatus; clientId?: string }): Promise<DeliveryEntity[]> {
  return repo.list(tenantId, filters);
}

export async function getTodayRoute(repo: DeliveryRepository, tenantId: string): Promise<DeliveryEntity[]> {
  return repo.findPendingToday(tenantId);
}
