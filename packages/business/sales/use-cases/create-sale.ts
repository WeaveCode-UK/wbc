import type { Sale } from '../domain/entities';
import { calculateSaleTotal } from '../domain/entities';
import type { SaleRepository } from '../ports/sale-repository';

export interface CreateSaleInput {
  tenantId: string;
  clientId: string;
  items: Array<{ productId: string; quantity: number; unitPrice: number }>;
  paymentMethod?: string;
  discount?: number;
  cashbackUsed?: number;
  campaignId?: string;
  notes?: string;
}

export async function createSale(
  input: CreateSaleInput,
  saleRepository: SaleRepository,
): Promise<Sale> {
  const total = calculateSaleTotal(input.items, input.discount ?? 0, input.cashbackUsed ?? 0);

  return saleRepository.create({
    tenantId: input.tenantId,
    clientId: input.clientId,
    items: input.items,
    paymentMethod: input.paymentMethod,
    discount: input.discount,
    cashbackUsed: input.cashbackUsed,
    campaignId: input.campaignId,
    notes: input.notes,
  });
}
