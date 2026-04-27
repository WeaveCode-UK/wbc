export class SaleNotFoundError extends Error {
  constructor(id?: string) {
    super(id ? `Sale not found: ${id}` : "Sale not found");
    this.name = "SaleNotFoundError";
  }
}
export class InvalidSaleStatusError extends Error {
  constructor(current: string, target: string) {
    super(`Cannot transition from ${current} to ${target}`);
    this.name = "InvalidSaleStatusError";
  }
}
export class PaymentNotFoundError extends Error {
  constructor() {
    super("Payment not found");
    this.name = "PaymentNotFoundError";
  }
}
export class InvalidPaymentTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPaymentTransitionError";
  }
}
export class InsufficientCashbackError extends Error {
  constructor() {
    super("Insufficient cashback balance");
    this.name = "InsufficientCashbackError";
  }
}
export class RefundExceedsSaleTotalError extends Error {
  constructor(requested: number, alreadyRefunded: number, saleTotal: number) {
    super(
      `Refund exceeds sale total: requested ${requested}, already refunded ${alreadyRefunded}, sale total ${saleTotal}`,
    );
    this.name = "RefundExceedsSaleTotalError";
  }
}
export class SaleNotRefundableError extends Error {
  constructor(status: string) {
    super(`Sale in status ${status} cannot be refunded`);
    this.name = "SaleNotRefundableError";
  }
}
export class InvalidRefundAmountError extends Error {
  constructor() {
    super("Refund amount must be greater than zero");
    this.name = "InvalidRefundAmountError";
  }
}
