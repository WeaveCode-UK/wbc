import type { Cashback } from "../domain/entities";

export interface CashbackRepository {
  getBalance(
    tenantId: string,
    clientId: string,
  ): Promise<{ available: number; expiring: Cashback[] }>;
  create(data: {
    tenantId: string;
    clientId: string;
    amount: number;
    expiresAt: Date;
    originSaleId: string;
  }): Promise<Cashback>;
  /**
   * Spend cashback. When `idempotencyKey` is provided (ACH-012
   * dados-persistencia), the redemption is recorded in
   * `CashbackRedemption` atomically with the balance update — a retry
   * with the same key is a no-op instead of double-spending.
   */
  use(
    tenantId: string,
    clientId: string,
    amount: number,
    idempotencyKey?: string,
  ): Promise<void>;
}
