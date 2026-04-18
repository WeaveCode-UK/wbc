// Regras de negócio puras de cashback — extraídas de adapters (ACH-005).
// domain/ é a autoridade sobre cálculos; adapters apenas persistem.

export const CASHBACK_EXPIRING_SOON_DAYS = 30;
export const MS_PER_DAY = 1000 * 60 * 60 * 24;

export interface CashbackRecord {
  amount: number | { toString(): string };
  usedAmount: number | { toString(): string };
  expiresAt: Date;
}

function toNumber(v: number | { toString(): string }): number {
  return typeof v === "number" ? v : Number(v.toString());
}

// Saldo disponível = soma de (amount - usedAmount) dos cashbacks ainda válidos.
// Cashbacks expirados devem ter sido filtrados pelo caller.
export function computeAvailableCashback(
  cashbacks: readonly CashbackRecord[],
): number {
  return cashbacks.reduce(
    (sum, c) => sum + toNumber(c.amount) - toNumber(c.usedAmount),
    0,
  );
}

// Dias até expirar, arredondados para cima (cashback ainda é utilizável no último dia).
export function daysUntilExpiry(
  expiresAt: Date,
  now: Date = new Date(),
): number {
  return Math.ceil((expiresAt.getTime() - now.getTime()) / MS_PER_DAY);
}

// Cashback que expira em até N dias deve ser sinalizado ao usuário para uso antes da perda.
export function isCashbackExpiringSoon(
  expiresAt: Date,
  thresholdDays: number = CASHBACK_EXPIRING_SOON_DAYS,
  now: Date = new Date(),
): boolean {
  return daysUntilExpiry(expiresAt, now) <= thresholdDays;
}

// Alocação: quanto do 'available' deste cashback pode ser usado para cobrir 'remaining' da compra.
// Nunca mais que available, nunca mais que remaining, nunca negativo.
export function computeCashbackAllocation(
  available: number,
  remaining: number,
): number {
  return Math.max(0, Math.min(available, remaining));
}
