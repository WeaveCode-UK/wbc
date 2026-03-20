export class StockNotFoundError extends Error {
  constructor(productId?: string) { super(productId ? `Stock not found for product: ${productId}` : 'Stock not found'); this.name = 'StockNotFoundError'; }
}
export class InsufficientStockError extends Error {
  constructor(productId: string, available: number, requested: number) { super(`Insufficient stock for ${productId}: available ${available}, requested ${requested}`); this.name = 'InsufficientStockError'; }
}
export class OrderNotFoundError extends Error {
  constructor(id?: string) { super(id ? `Order not found: ${id}` : 'Order not found'); this.name = 'OrderNotFoundError'; }
}
