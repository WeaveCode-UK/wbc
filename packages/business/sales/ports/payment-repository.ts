import type { Payment } from '../domain/entities';

export interface PaymentRepository {
  findBySaleId(saleId: string): Promise<Payment[]>;
  markPaid(id: string): Promise<Payment>;
  listOverdue(tenantId: string): Promise<Payment[]>;
  listAccountsReceivable(tenantId: string, filters: { status?: string }): Promise<{ data: Payment[]; totalPending: number }>;
}
