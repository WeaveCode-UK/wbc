export type SaleStatus =
  | "DRAFT"
  | "CONFIRMED"
  | "SEPARATED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";
export type PayMethod =
  | "CASH"
  | "PIX"
  | "CREDIT_CARD"
  | "DEBIT_CARD"
  | "INSTALLMENT"
  | "BANK_TRANSFER"
  | "OTHER";
export type PayStatus = "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";

export const CASHBACK_PERCENTAGE = 0.05; // 5%
export const CASHBACK_EXPIRY_DAYS = 90;

// Regras de negócio puras — extraídas de adapters para respeitar ADR-001 (hexagonal).
// ACH-005: domain/ é a autoridade sobre cálculos financeiros; adapters só persistem.

export interface SaleItemInput {
  quantity: number;
  unitPrice: number;
}

export function computeItemSubtotal(
  quantity: number,
  unitPrice: number,
): number {
  return quantity * unitPrice;
}

export function computeSaleSubtotal(items: readonly SaleItemInput[]): number {
  return items.reduce(
    (sum, item) => sum + computeItemSubtotal(item.quantity, item.unitPrice),
    0,
  );
}

// O total nunca pode ser negativo: desconto + cashback acima do subtotal zeram o total,
// não geram débito. Invariante de negócio explícita no ADR-001/sales.
export function computeSaleTotal(
  subtotal: number,
  discount: number = 0,
  cashbackUsed: number = 0,
): number {
  return Math.max(0, subtotal - discount - cashbackUsed);
}
