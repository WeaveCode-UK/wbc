import type { Stock } from '../domain/entities';
import { isStockLow, isStockDepleted } from '../domain/entities';
import type { StockRepository } from '../ports/stock-repository';
import { publish, EVENTS } from '@wbc/shared';
import type { StockLowPayload, StockDepletedPayload } from '../domain/events';

export async function listStock(tenantId: string, lowOnly: boolean | undefined, stockRepo: StockRepository): Promise<Stock[]> {
  return stockRepo.list(tenantId, lowOnly);
}

export async function updateStock(tenantId: string, productId: string, quantity: number, stockRepo: StockRepository): Promise<Stock> {
  const stock = await stockRepo.updateQuantity(tenantId, productId, quantity);
  await checkStockAlerts(stock);
  return stock;
}

export async function adjustStock(tenantId: string, productId: string, adjustment: number, stockRepo: StockRepository): Promise<Stock> {
  const stock = await stockRepo.adjustQuantity(tenantId, productId, adjustment);
  await checkStockAlerts(stock);
  return stock;
}

export async function decrementStockForSale(
  tenantId: string,
  items: Array<{ productId: string; quantity: number }>,
  stockRepo: StockRepository,
): Promise<void> {
  await stockRepo.decrementForSale(tenantId, items);

  // Check alerts for each product
  for (const item of items) {
    const stock = await stockRepo.findByProductId(tenantId, item.productId);
    if (stock) {
      await checkStockAlerts(stock);
    }
  }
}

async function checkStockAlerts(stock: Stock): Promise<void> {
  if (isStockDepleted(stock)) {
    await publish<StockDepletedPayload>(EVENTS.STOCK_DEPLETED, stock.tenantId, {
      tenantId: stock.tenantId,
      productId: stock.productId,
    });
  } else if (isStockLow(stock)) {
    await publish<StockLowPayload>(EVENTS.STOCK_LOW, stock.tenantId, {
      tenantId: stock.tenantId,
      productId: stock.productId,
      quantity: stock.quantity,
      minAlert: stock.minAlert,
    });
  }
}
