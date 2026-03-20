import { subscribe, EVENTS } from '@wbc/shared';
import { PrismaStockRepository } from './prisma-stock-repository';
import { decrementStockForSale } from '../use-cases/manage-stock';

const stockRepo = new PrismaStockRepository();

export function registerInventoryEventHandlers(): void {
  subscribe(EVENTS.SALE_CONFIRMED, async (event) => {
    const payload = event.payload as { tenantId: string; items: Array<{ productId: string; quantity: number }> };
    await decrementStockForSale(payload.tenantId, payload.items, stockRepo);
  });
}
