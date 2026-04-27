/**
 * Centralised helpers for the `SaleStatus` / `PayMethod` enums declared
 * in `domain/value-objects.ts` (ACH-012 codigo-manutenibilidade). Adapters
 * and filters import from here so the allowed-values lists live in one
 * place — adding a new status is one edit instead of N scattered literals.
 * The enum type itself keeps living in value-objects.ts to avoid breaking
 * existing imports and to keep one source of truth.
 */
import type { SaleStatus, PayMethod } from "./value-objects";

// Must stay aligned with `enum SaleStatus` in `packages/db/prisma/schema.prisma`.
export const SALE_STATUSES: SaleStatus[] = [
  "DRAFT",
  "CONFIRMED",
  "SEPARATED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

/** Statuses that count as "completed" for revenue/commission reports. */
export const COMPLETED_SALE_STATUSES: SaleStatus[] = ["CONFIRMED", "DELIVERED"];

export const PAYMENT_METHODS: PayMethod[] = [
  "CASH",
  "PIX",
  "CREDIT_CARD",
  "DEBIT_CARD",
  "INSTALLMENT",
  "BANK_TRANSFER",
  "OTHER",
];

/** Backwards-compat alias. New code imports `PayMethod` directly. */
export type PaymentMethod = PayMethod;

/**
 * Prisma-friendly `in` filter helper. Use as
 *   where: { status: statusIn(COMPLETED_SALE_STATUSES) }
 */
export function statusIn<T extends string>(values: readonly T[]): { in: T[] } {
  return { in: [...values] };
}

// ACH-022 seguranca: state machine for Sale status. Without this, the
// updateSaleStatus use-case accepted any transition (e.g.
// CANCELLED → CONFIRMED, DELIVERED → DRAFT) and triggered side effects
// downstream as if the move were legitimate. Terminal states
// (DELIVERED, CANCELLED) have no outgoing transitions; CONFIRMED is
// reached via the dedicated confirm-sale flow, not via updateStatus.
const SALE_TRANSITIONS: Record<SaleStatus, readonly SaleStatus[]> = {
  DRAFT: ["CANCELLED"],
  CONFIRMED: ["SEPARATED", "CANCELLED"],
  SEPARATED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function isValidSaleTransition(
  from: SaleStatus,
  to: SaleStatus,
): boolean {
  return SALE_TRANSITIONS[from]?.includes(to) ?? false;
}
