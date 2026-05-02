// F11.E08: shape mirrors the Prisma model so use-cases can stay
// agnostic of the persistence layer.

export interface LoyaltyAccount {
  id: string;
  tenantId: string;
  clientId: string;
  balance: number;
  lifetimeEarned: number;
  createdAt: Date;
  updatedAt: Date;
}

export type LoyaltyTransactionKind = "EARN" | "REDEEM" | "EXPIRE" | "ADJUST";

export interface LoyaltyTransaction {
  id: string;
  tenantId: string;
  pointsId: string;
  clientId: string;
  kind: LoyaltyTransactionKind;
  /** signed integer: positive for EARN/ADJUST(+), negative for REDEEM/EXPIRE/ADJUST(-) */
  amount: number;
  saleId: string | null;
  note: string | null;
  createdAt: Date;
  expiresAt: Date | null;
}
