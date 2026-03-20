import type { Payment } from '../domain/entities';
import type { PaymentRepository } from '../ports/payment-repository';

export async function listPayments(saleId: string, paymentRepo: PaymentRepository): Promise<Payment[]> {
  return paymentRepo.findBySaleId(saleId);
}

export async function markPaid(paymentId: string, paymentRepo: PaymentRepository): Promise<Payment> {
  return paymentRepo.markPaid(paymentId);
}

export async function getAccountsReceivable(
  tenantId: string,
  filters: { status?: string },
  paymentRepo: PaymentRepository,
): Promise<{ data: Payment[]; totalPending: number }> {
  return paymentRepo.listAccountsReceivable(tenantId, filters);
}
