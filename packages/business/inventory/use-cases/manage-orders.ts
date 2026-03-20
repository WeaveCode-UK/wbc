import type { BrandOrder } from '../domain/entities';
import type { BrandOrderRepository } from '../ports/brand-order-repository';
import { OrderNotFoundError } from '../domain/errors';

export async function listOrders(tenantId: string, status: string | undefined, orderRepo: BrandOrderRepository): Promise<BrandOrder[]> {
  return orderRepo.list(tenantId, status);
}

export async function createOrder(
  tenantId: string,
  brandId: string,
  items: Array<{ productName: string; quantity: number; unitCost: number }>,
  notes: string | undefined,
  orderRepo: BrandOrderRepository,
): Promise<BrandOrder> {
  return orderRepo.create({ tenantId, brandId, items, notes });
}

export async function receiveOrder(tenantId: string, id: string, orderRepo: BrandOrderRepository): Promise<BrandOrder> {
  const order = await orderRepo.findById(tenantId, id);
  if (!order) throw new OrderNotFoundError(id);
  return orderRepo.updateStatus(tenantId, id, 'RECEIVED', new Date());
}

export async function cancelOrder(tenantId: string, id: string, orderRepo: BrandOrderRepository): Promise<BrandOrder> {
  const order = await orderRepo.findById(tenantId, id);
  if (!order) throw new OrderNotFoundError(id);
  return orderRepo.updateStatus(tenantId, id, 'CANCELLED');
}
