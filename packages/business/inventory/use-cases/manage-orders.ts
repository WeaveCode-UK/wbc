import type { BrandOrder } from "../domain/entities";
import type { BrandOrderRepository } from "../ports/brand-order-repository";
import {
  OrderNotFoundError,
  InvalidOrderStatusError,
  isValidOrderTransition,
} from "../domain/errors";

export async function listOrders(
  tenantId: string,
  status: string | undefined,
  orderRepo: BrandOrderRepository,
): Promise<BrandOrder[]> {
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

export async function receiveOrder(
  tenantId: string,
  id: string,
  orderRepo: BrandOrderRepository,
): Promise<BrandOrder> {
  const order = await orderRepo.findById(tenantId, id);
  if (!order) throw new OrderNotFoundError(id);
  // ACH-027 seguranca: only PENDING orders may be received. Receiving
  // a CANCELLED order would re-trigger stock increments downstream.
  if (!isValidOrderTransition(order.status, "RECEIVED")) {
    throw new InvalidOrderStatusError(order.status, "RECEIVED");
  }
  return orderRepo.updateStatus(tenantId, id, "RECEIVED", new Date());
}

export async function cancelOrder(
  tenantId: string,
  id: string,
  orderRepo: BrandOrderRepository,
): Promise<BrandOrder> {
  const order = await orderRepo.findById(tenantId, id);
  if (!order) throw new OrderNotFoundError(id);
  // ACH-027 seguranca: cancelling a RECEIVED order is forbidden —
  // stock has already been incremented and the inventory consequence
  // would have to be undone separately.
  if (!isValidOrderTransition(order.status, "CANCELLED")) {
    throw new InvalidOrderStatusError(order.status, "CANCELLED");
  }
  return orderRepo.updateStatus(tenantId, id, "CANCELLED");
}
