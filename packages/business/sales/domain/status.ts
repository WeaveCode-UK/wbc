/**
 * Centralised Sale status / payment-method enums (ACH-012 codigo-
 * manutenibilidade). Adapters and filters MUST import from here instead of
 * inlining string literals — adding a new status then becomes one edit
 * instead of N scattered greps.
 */
export const SALE_STATUSES = [
  "DRAFT",
  "CONFIRMED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

export type SaleStatus = (typeof SALE_STATUSES)[number];

/** Statuses that count as "completed" for revenue/commission reports. */
export const COMPLETED_SALE_STATUSES: SaleStatus[] = ["CONFIRMED", "DELIVERED"];

export const PAYMENT_METHODS = [
  "CASH",
  "PIX",
  "CREDIT_CARD",
  "DEBIT_CARD",
  "INSTALLMENT",
  "BANK_TRANSFER",
  "OTHER",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/**
 * Prisma-friendly `in` filter helper. Use as
 *   where: { status: statusIn(COMPLETED_SALE_STATUSES) }
 */
export function statusIn<T extends string>(values: readonly T[]): { in: T[] } {
  return { in: [...values] };
}
