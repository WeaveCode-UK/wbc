export class SaleNotFoundError extends Error {
  constructor(id?: string) { super(id ? `Sale not found: ${id}` : 'Sale not found'); this.name = 'SaleNotFoundError'; }
}
export class InvalidSaleStatusError extends Error {
  constructor(current: string, target: string) { super(`Cannot transition from ${current} to ${target}`); this.name = 'InvalidSaleStatusError'; }
}
export class PaymentNotFoundError extends Error {
  constructor() { super('Payment not found'); this.name = 'PaymentNotFoundError'; }
}
export class InsufficientCashbackError extends Error {
  constructor() { super('Insufficient cashback balance'); this.name = 'InsufficientCashbackError'; }
}
