import { prisma } from '@wbc/db';
import type { PaymentRepository } from '../ports/payment-repository';
import type { Payment } from '../domain/entities';

export class PrismaPaymentRepository implements PaymentRepository {
  async findBySaleId(saleId: string): Promise<Payment[]> {
    const payments = await prisma.payment.findMany({ where: { saleId }, orderBy: { installmentNumber: 'asc' } });
    return payments.map((p) => ({ ...p, amount: Number(p.amount) })) as Payment[];
  }

  async markPaid(id: string): Promise<Payment> {
    const p = await prisma.payment.update({ where: { id }, data: { status: 'PAID', paidAt: new Date() } });
    return { ...p, amount: Number(p.amount) } as Payment;
  }

  async listOverdue(tenantId: string): Promise<Payment[]> {
    const payments = await prisma.payment.findMany({
      where: { status: 'OVERDUE', sale: { tenantId } },
      include: { sale: { select: { tenantId: true } } },
    });
    return payments.map((p) => ({ ...p, amount: Number(p.amount) })) as Payment[];
  }

  async listAccountsReceivable(tenantId: string, filters: { status?: string }) {
    const where: Record<string, unknown> = { sale: { tenantId } };
    if (filters.status) where.status = filters.status;
    else where.status = 'PENDING';

    const payments = await prisma.payment.findMany({ where, orderBy: { dueDate: 'asc' } });
    const totalPending = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      data: payments.map((p) => ({ ...p, amount: Number(p.amount) })) as Payment[],
      totalPending,
    };
  }
}
