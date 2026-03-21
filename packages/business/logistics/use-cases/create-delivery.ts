import type { DeliveryRepository } from '../ports/delivery-repository';
import type { DeliveryEntity, DeliveryMethod } from '../domain/entities';

export interface CreateDeliveryInput {
  tenantId: string;
  saleId: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  address?: string;
  method: DeliveryMethod;
  estimatedDate?: Date;
  notes?: string;
}

export async function createDelivery(repo: DeliveryRepository, input: CreateDeliveryInput): Promise<DeliveryEntity> {
  return repo.create({ tenantId: input.tenantId, saleId: input.saleId, clientId: input.clientId, clientName: input.clientName, clientPhone: input.clientPhone, address: input.address ?? null, method: input.method, status: 'CONFIRMED', trackingCode: null, estimatedDate: input.estimatedDate ?? null, notes: input.notes ?? null });
}
