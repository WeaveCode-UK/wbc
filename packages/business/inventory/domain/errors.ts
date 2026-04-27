export class StockNotFoundError extends Error {
  constructor(productId?: string) {
    super(
      productId
        ? `Stock not found for product: ${productId}`
        : "Stock not found",
    );
    this.name = "StockNotFoundError";
  }
}
export class InsufficientStockError extends Error {
  constructor(productId: string, available: number, requested: number) {
    super(
      `Insufficient stock for ${productId}: available ${available}, requested ${requested}`,
    );
    this.name = "InsufficientStockError";
  }
}
export class OrderNotFoundError extends Error {
  constructor(id?: string) {
    super(id ? `Order not found: ${id}` : "Order not found");
    this.name = "OrderNotFoundError";
  }
}
export class InvalidOrderStatusError extends Error {
  constructor(current: string, target: string) {
    super(`Cannot transition order from ${current} to ${target}`);
    this.name = "InvalidOrderStatusError";
  }
}

// ACH-027 seguranca: BrandOrder state machine. PENDING is the only
// non-terminal state; both RECEIVED and CANCELLED are terminal so
// orders cannot be re-received or un-cancelled. Without this guard
// receiveOrder/cancelOrder accepted any transition, including
// flipping a CANCELLED order back to RECEIVED (which would
// re-increment stock if the receive handler ran).
const ORDER_TRANSITIONS: Record<string, readonly string[]> = {
  PENDING: ["RECEIVED", "CANCELLED"],
  RECEIVED: [],
  CANCELLED: [],
};

export function isValidOrderTransition(from: string, to: string): boolean {
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}
