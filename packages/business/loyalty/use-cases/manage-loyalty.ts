import type { LoyaltyAccount, LoyaltyTransaction } from "../domain/entities";
import type { LoyaltyRepository } from "../ports/loyalty-repository";
import {
  InsufficientLoyaltyBalanceError,
  LoyaltyAccountNotFoundError,
} from "../domain/errors";

// F11.E08: business rules for the loyalty programme. Default rule is
// 1 point per BRL 10 spent — kept as a constant so an admin UI can later
// expose it per-tenant via PlanQuota.

export const POINTS_PER_BRL = 1 / 10;
const EXPIRES_AFTER_DAYS = 365;

export interface EarnFromSaleInput {
  tenantId: string;
  clientId: string;
  saleId: string;
  saleTotal: number;
  multiplier?: number;
}

/** Convert a sale total into points (rounded down) and credit the client. */
export async function earnFromSale(
  input: EarnFromSaleInput,
  repo: LoyaltyRepository,
): Promise<LoyaltyAccount> {
  const multiplier = input.multiplier ?? 1;
  const earned = Math.floor(input.saleTotal * POINTS_PER_BRL * multiplier);
  if (earned <= 0) {
    return repo.getOrCreate(input.tenantId, input.clientId);
  }
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + EXPIRES_AFTER_DAYS);
  return repo.applyTransaction({
    tenantId: input.tenantId,
    clientId: input.clientId,
    kind: "EARN",
    delta: earned,
    saleId: input.saleId,
    expiresAt,
  });
}

export interface RedeemPointsInput {
  tenantId: string;
  clientId: string;
  points: number;
  note?: string;
}

export async function redeemPoints(
  input: RedeemPointsInput,
  repo: LoyaltyRepository,
): Promise<LoyaltyAccount> {
  if (input.points <= 0) {
    throw new InsufficientLoyaltyBalanceError(0, input.points);
  }
  const existing = await repo.findByClientId(input.tenantId, input.clientId);
  if (!existing) {
    throw new LoyaltyAccountNotFoundError(input.clientId);
  }
  return repo.applyTransaction({
    tenantId: input.tenantId,
    clientId: input.clientId,
    kind: "REDEEM",
    delta: -input.points,
    note: input.note ?? null,
  });
}

export async function getLoyaltyBalance(
  tenantId: string,
  clientId: string,
  repo: LoyaltyRepository,
): Promise<LoyaltyAccount> {
  return repo.getOrCreate(tenantId, clientId);
}

export async function getLoyaltyStatement(
  tenantId: string,
  clientId: string,
  repo: LoyaltyRepository,
  limit = 100,
): Promise<LoyaltyTransaction[]> {
  return repo.listTransactions(tenantId, clientId, limit);
}
