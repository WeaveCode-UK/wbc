import type { Sale } from '../domain/entities';
import type { SaleRepository } from '../ports/sale-repository';
import { SaleNotFoundError, InvalidSaleStatusError } from '../domain/errors';
import { publish, EVENTS } from '@wbc/shared';
import type { SaleCancelledPayload } from '../domain/events';

export async function cancelSale(
  tenantId: string,
  saleId: string,
  saleRepository: SaleRepository,
): Promise<Sale> {
  const sale = await saleRepository.findById(tenantId, saleId);
  if (!sale) throw new SaleNotFoundError(saleId);
  if (sale.status === 'CANCELLED' || sale.status === 'DELIVERED') {
    throw new InvalidSaleStatusError(sale.status, 'CANCELLED');
  }

  const cancelled = await saleRepository.updateStatus(tenantId, saleId, 'CANCELLED');

  // Only emit if was previously confirmed (not draft)
  if (sale.status !== 'DRAFT') {
    await publish<SaleCancelledPayload>(EVENTS.SALE_CANCELLED, tenantId, {
      tenantId,
      saleId,
    });
  }

  return cancelled;
}
