import type { SaleRepository } from '../ports/sale-repository';
import type { ReturnRepository } from '../ports/return-repository';
import { SaleNotFoundError } from '../domain/errors';

export interface CreateReturnInput {
  tenantId: string;
  saleId: string;
  reason: string;
  refundAmount: number;
}

export async function createReturn(input: CreateReturnInput, saleRepo: SaleRepository, returnRepo?: ReturnRepository) {
  const sale = await saleRepo.findById(input.tenantId, input.saleId);
  if (!sale) throw new SaleNotFoundError(input.saleId);

  if (!returnRepo) throw new Error('Return repository is required');
  return returnRepo.create(input.saleId, input.reason, input.refundAmount);
}
