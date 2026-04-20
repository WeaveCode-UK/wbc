import { Prisma, prisma } from "@wbc/db";
import type { CashbackRepository } from "../ports/cashback-repository";
import type { Cashback } from "../domain/entities";
import {
  computeAvailableCashback,
  computeCashbackAllocation,
  isCashbackExpiringSoon,
} from "../domain/cashback";

export class PrismaCashbackRepository implements CashbackRepository {
  async getBalance(tenantId: string, clientId: string) {
    const cashbacks = await prisma.cashback.findMany({
      where: { tenantId, clientId, expiresAt: { gt: new Date() } },
      orderBy: { expiresAt: "asc" },
    });

    const available = computeAvailableCashback(cashbacks);
    const expiring = cashbacks
      .filter((c) => isCashbackExpiringSoon(c.expiresAt))
      .map((c) => ({
        ...c,
        amount: Number(c.amount),
        usedAmount: Number(c.usedAmount),
      })) as Cashback[];

    return { available, expiring };
  }

  async create(data: {
    tenantId: string;
    clientId: string;
    amount: number;
    expiresAt: Date;
    originSaleId: string;
  }): Promise<Cashback> {
    const c = await prisma.cashback.create({ data });
    return {
      ...c,
      amount: Number(c.amount),
      usedAmount: Number(c.usedAmount),
    } as Cashback;
  }

  async use(
    tenantId: string,
    clientId: string,
    amount: number,
    idempotencyKey?: string,
  ): Promise<void> {
    await prisma.$transaction(
      async (tx) => {
        // ACH-012 dados-persistencia: record the redemption first so a
        // retry with the same key collides on the PK before touching
        // any balance. Without this, a retried confirmSale could spend
        // the cashback twice even under Serializable (the second call
        // runs in a different transaction so Serializable only
        // protects against concurrent-in-time collisions, not against
        // deliberate replays across time).
        if (idempotencyKey) {
          try {
            await tx.cashbackRedemption.create({
              data: { tenantId, idempotencyKey, clientId, amount },
            });
          } catch (err) {
            if (
              err instanceof Prisma.PrismaClientKnownRequestError &&
              err.code === "P2002"
            ) {
              // Already redeemed with this key — no-op.
              return;
            }
            throw err;
          }
        }

        // Serializable isolation prevents concurrent cashback usage from overspending
        const cashbacks = await tx.cashback.findMany({
          where: { tenantId, clientId, expiresAt: { gt: new Date() } },
          orderBy: { expiresAt: "asc" },
        });

        let remaining = amount;
        for (const c of cashbacks) {
          if (remaining <= 0) break;
          const available = Number(c.amount) - Number(c.usedAmount);
          const toUse = computeCashbackAllocation(available, remaining);
          await tx.cashback.update({
            where: { id: c.id },
            data: { usedAmount: Number(c.usedAmount) + toUse },
          });
          remaining -= toUse;
        }
      },
      { isolationLevel: "Serializable" },
    );
  }
}
