import type { SaleRepository } from '../ports/sale-repository';
import { SaleNotFoundError } from '../domain/errors';
import { prisma } from '@wbc/db';

export interface CreateReturnInput {
  tenantId: string;
  saleId: string;
  reason: string;
  refundAmount: number;
}

export async function createReturn(input: CreateReturnInput, saleRepo: SaleRepository) {
  const sale = await saleRepo.findById(input.tenantId, input.saleId);
  if (!sale) throw new SaleNotFoundError(input.saleId);

  const returnRecord = await prisma.return.create({
    data: {
      saleId: input.saleId,
      reason: input.reason,
      refundAmount: input.refundAmount,
    },
  });

  return returnRecord;
}
