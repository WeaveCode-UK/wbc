import { prisma } from "@wbc/db";
import type {
  LoyaltyAccount,
  LoyaltyTransaction,
  LoyaltyTransactionKind,
} from "../domain/entities";
import type { LoyaltyRepository } from "../ports/loyalty-repository";
import { InsufficientLoyaltyBalanceError } from "../domain/errors";

// F11.E08: Prisma adapter for the loyalty programme. All mutations run
// inside a Serializable transaction so the balance can never drift from
// the sum of transactions for a given client.

export class PrismaLoyaltyRepository implements LoyaltyRepository {
  async getOrCreate(
    tenantId: string,
    clientId: string,
  ): Promise<LoyaltyAccount> {
    const existing = await prisma.loyaltyPoints.findUnique({
      where: { clientId },
    });
    if (existing) return existing as LoyaltyAccount;
    const created = await prisma.loyaltyPoints.create({
      data: { tenantId, clientId, balance: 0, lifetimeEarned: 0 },
    });
    return created as LoyaltyAccount;
  }

  async findByClientId(
    _tenantId: string,
    clientId: string,
  ): Promise<LoyaltyAccount | null> {
    const account = await prisma.loyaltyPoints.findUnique({
      where: { clientId },
    });
    return account as LoyaltyAccount | null;
  }

  async applyTransaction(input: {
    tenantId: string;
    clientId: string;
    kind: LoyaltyTransactionKind;
    delta: number;
    saleId?: string | null;
    note?: string | null;
    expiresAt?: Date | null;
  }): Promise<LoyaltyAccount> {
    return prisma.$transaction(
      async (tx) => {
        const account =
          (await tx.loyaltyPoints.findUnique({
            where: { clientId: input.clientId },
          })) ??
          (await tx.loyaltyPoints.create({
            data: {
              tenantId: input.tenantId,
              clientId: input.clientId,
              balance: 0,
              lifetimeEarned: 0,
            },
          }));

        const newBalance = account.balance + input.delta;
        if (newBalance < 0) {
          throw new InsufficientLoyaltyBalanceError(
            account.balance,
            -input.delta,
          );
        }
        const newLifetime =
          input.delta > 0 && (input.kind === "EARN" || input.kind === "ADJUST")
            ? account.lifetimeEarned + input.delta
            : account.lifetimeEarned;

        await tx.loyaltyTransaction.create({
          data: {
            tenantId: input.tenantId,
            pointsId: account.id,
            clientId: input.clientId,
            kind: input.kind,
            amount: input.delta,
            saleId: input.saleId ?? null,
            note: input.note ?? null,
            expiresAt: input.expiresAt ?? null,
          },
        });

        const updated = await tx.loyaltyPoints.update({
          where: { id: account.id },
          data: { balance: newBalance, lifetimeEarned: newLifetime },
        });
        return updated as LoyaltyAccount;
      },
      { isolationLevel: "Serializable" },
    );
  }

  async listTransactions(
    tenantId: string,
    clientId: string,
    limit = 100,
  ): Promise<LoyaltyTransaction[]> {
    const rows = await prisma.loyaltyTransaction.findMany({
      where: { tenantId, clientId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows as LoyaltyTransaction[];
  }
}
