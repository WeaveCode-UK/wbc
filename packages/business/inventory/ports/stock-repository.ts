import type { Stock } from '../domain/entities';

export interface StockRepository {
  findByProductId(tenantId: string, productId: string): Promise<Stock | null>;
  list(tenantId: string, lowOnly?: boolean): Promise<Stock[]>;
  updateQuantity(tenantId: string, productId: string, quantity: number): Promise<Stock>;
  adjustQuantity(tenantId: string, productId: string, adjustment: number): Promise<Stock>;
  decrementForSale(tenantId: string, items: Array<{ productId: string; quantity: number }>): Promise<void>;
}
