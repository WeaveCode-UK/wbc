import { prisma } from "@wbc/db";
import type { PaymentRepository } from "../ports/payment-repository";
import type { Payment } from "../domain/entities";
import {
  PaymentNotFoundError,
  InvalidPaymentTransitionError,
} from "../domain/errors";

// ACH-023 seguranca: a payment can only be marked PAID while the
// underlying sale is in a state where collecting money makes sense.
// DRAFT means the order isn't even confirmed; CANCELLED means the
// order was reversed. Allowing markPaid on either re-collects on a
// sale that shouldn't carry receivables.
const SALE_STATES_PAYABLE = [
  "CONFIRMED",
  "SEPARATED",
  "SHIPPED",
  "DELIVERED",
] as const;

export class PrismaPaymentRepository implements PaymentRepository {
  async findBySaleId(tenantId: string, saleId: string): Promise<Payment[]> {
    const payments = await prisma.payment.findMany({
      where: { saleId, sale: { tenantId } },
      orderBy: { installmentNumber: "asc" },
    });
    return payments.map((p) => ({
      ...p,
      amount: Number(p.amount),
    })) as Payment[];
  }

  async markPaid(tenantId: string, id: string): Promise<Payment> {
    // ACH-023 seguranca: previously the read+write was non-atomic and
    // had no status guard. A retried call would re-stamp paidAt and
    // re-fire side effects; a payment whose sale was cancelled would
    // still flip to PAID. updateMany with a constrained WHERE turns
    // both into a single atomic check.
    const updated = await prisma.payment.updateMany({
      where: {
        id,
        status: "PENDING",
        sale: { tenantId, status: { in: [...SALE_STATES_PAYABLE] } },
      },
      data: { status: "PAID", paidAt: new Date() },
    });

    if (updated.count === 0) {
      // Distinguish "doesn't exist / wrong tenant" from "exists but
      // not in a payable state" so callers see the right error.
      const existing = await prisma.payment.findFirst({
        where: { id, sale: { tenantId } },
        include: { sale: { select: { status: true } } },
      });
      if (!existing) throw new PaymentNotFoundError();
      throw new InvalidPaymentTransitionError(
        `Cannot mark PAID: payment.status=${existing.status}, sale.status=${existing.sale.status}`,
      );
    }

    const p = await prisma.payment.findFirstOrThrow({
      where: { id, sale: { tenantId } },
    });
    return { ...p, amount: Number(p.amount) } as Payment;
  }

  async listOverdue(tenantId: string): Promise<Payment[]> {
    const payments = await prisma.payment.findMany({
      where: { status: "OVERDUE", sale: { tenantId } },
      include: { sale: { select: { tenantId: true } } },
    });
    return payments.map((p) => ({
      ...p,
      amount: Number(p.amount),
    })) as Payment[];
  }

  async listAccountsReceivable(tenantId: string, filters: { status?: string }) {
    const where: Record<string, unknown> = { sale: { tenantId } };
    if (filters.status) where.status = filters.status;
    else where.status = "PENDING";

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { dueDate: "asc" },
    });
    const totalPending = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      data: payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
      })) as Payment[],
      totalPending,
    };
  }
}
