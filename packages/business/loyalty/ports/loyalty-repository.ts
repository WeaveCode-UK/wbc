import type {
  LoyaltyAccount,
  LoyaltyTransaction,
  LoyaltyTransactionKind,
} from "../domain/entities";

// F11.E08: Hexagonal port. The Prisma adapter handles the
// account+transaction pair as a single Serializable transaction so the
// running balance never disagrees with the sum of transaction.amount.
export interface LoyaltyRepository {
  /** Returns the account, creating it on first access. */
  getOrCreate(tenantId: string, clientId: string): Promise<LoyaltyAccount>;

  findByClientId(
    tenantId: string,
    clientId: string,
  ): Promise<LoyaltyAccount | null>;

  /**
   * Apply a transaction and update the account balance atomically.
   * `delta` is signed; EARN/ADJUST(+) are positive, REDEEM/EXPIRE/ADJUST(-)
   * negative. Returns the updated account.
   */
  applyTransaction(input: {
    tenantId: string;
    clientId: string;
    kind: LoyaltyTransactionKind;
    delta: number;
    saleId?: string | null;
    note?: string | null;
    expiresAt?: Date | null;
  }): Promise<LoyaltyAccount>;

  listTransactions(
    tenantId: string,
    clientId: string,
    limit?: number,
  ): Promise<LoyaltyTransaction[]>;
}
