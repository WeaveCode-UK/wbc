import type { Sale } from '../domain/entities';
import type { SaleRepository } from '../ports/sale-repository';
import { SaleNotFoundError } from '../domain/errors';
import { publish, EVENTS } from '@wbc/shared';
import type { SaleStatusChangedPayload } from '../domain/events';

export async function updateSaleStatus(
  tenantId: string,
  saleId: string,
  newStatus: string,
  saleRepository: SaleRepository,
): Promise<Sale> {
  const sale = await saleRepository.findById(tenantId, saleId);
  if (!sale) throw new SaleNotFoundError(saleId);

  const updated = await saleRepository.updateStatus(tenantId, saleId, newStatus);

  await publish<SaleStatusChangedPayload>(EVENTS.SALE_STATUS_CHANGED, tenantId, {
    tenantId,
    saleId,
    oldStatus: sale.status,
    newStatus,
  });

  return updated;
}
