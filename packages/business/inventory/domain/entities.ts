export type OrderStatus = 'ORDERED' | 'PARTIAL' | 'RECEIVED' | 'CANCELLED';

export interface Stock {
  id: string;
  tenantId: string;
  productId: string;
  quantity: number;
  minAlert: number;
}

export interface BrandOrder {
  id: string;
  tenantId: string;
  brandId: string;
  status: OrderStatus;
  notes: string | null;
  orderedAt: Date;
  receivedAt: Date | null;
}

export interface BrandOrderItem {
  id: string;
  brandOrderId: string;
  productName: string;
  quantity: number;
  unitCost: number;
}

export interface Sample {
  id: string;
  tenantId: string;
  productId: string;
  clientId: string | null;
  quantity: number;
  cost: number;
  resultedInSale: boolean;
  createdAt: Date;
}

export function isStockLow(stock: Stock): boolean {
  return stock.minAlert > 0 && stock.quantity <= stock.minAlert;
}

export function isStockDepleted(stock: Stock): boolean {
  return stock.quantity <= 0;
}
