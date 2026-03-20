import type { Sale } from '../domain/entities';
import { calculateCashback, getCashbackExpiryDate } from '../domain/entities';
import type { SaleRepository } from '../ports/sale-repository';
import type { CashbackRepository } from '../ports/cashback-repository';
import { SaleNotFoundError, InvalidSaleStatusError } from '../domain/errors';
import { publish, EVENTS } from '@wbc/shared';
import type { SaleConfirmedPayload } from '../domain/events';

export async function confirmSale(
  tenantId: string,
  saleId: string,
  saleRepository: SaleRepository,
  cashbackRepository: CashbackRepository,
): Promise<Sale> {
  const sale = await saleRepository.findById(tenantId, saleId);
  if (!sale) throw new SaleNotFoundError(saleId);
  if (sale.status !== 'DRAFT') throw new InvalidSaleStatusError(sale.status, 'CONFIRMED');

  const confirmed = await saleRepository.updateStatus(tenantId, saleId, 'CONFIRMED');

  // Generate cashback
  const cashbackAmount = calculateCashback(sale.total);
  if (cashbackAmount > 0) {
    await cashbackRepository.create({
      tenantId,
      clientId: sale.clientId,
      amount: cashbackAmount,
      expiresAt: getCashbackExpiryDate(),
      originSaleId: saleId,
    });
  }

  // Emit event
  await publish<SaleConfirmedPayload>(EVENTS.SALE_CONFIRMED, tenantId, {
    tenantId,
    saleId,
    clientId: sale.clientId,
    total: sale.total,
    items: sale.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
  });

  return confirmed;
}
