import type { Sale } from "../domain/entities";
import { calculateCashback, getCashbackExpiryDate } from "../domain/entities";
import type { SaleRepository } from "../ports/sale-repository";
import type { CashbackRepository } from "../ports/cashback-repository";
import { SaleNotFoundError, InvalidSaleStatusError } from "../domain/errors";
import { EVENTS } from "@wbc/shared";
import type { SaleConfirmedPayload } from "../domain/events";

/**
 * ACH-001 dados-persistencia: status flip, cashback issue, stock
 * decrement and outbox event now commit together via
 * `saleRepository.confirmAtomic`. Before, the handler decrementing
 * stock ran async off the outbox event — a crash between commit and
 * handler run left the sale CONFIRMED with stock intact, producing
 * oversells the moment a second customer bought the same SKU.
 *
 * `cashbackRepository` stays on the signature (public API) so callers
 * don't need to change; it's no longer invoked here because the
 * Cashback row is inserted inside the atomic transaction.
 */
export async function confirmSale(
  tenantId: string,
  saleId: string,
  saleRepository: SaleRepository,
  // `cashbackRepository` kept for signature compatibility; unused now.
  _cashbackRepository: CashbackRepository,
): Promise<Sale> {
  const sale = await saleRepository.findById(tenantId, saleId);
  if (!sale) throw new SaleNotFoundError(saleId);
  if (sale.status !== "DRAFT")
    throw new InvalidSaleStatusError(sale.status, "CONFIRMED");

  const cashbackAmount = calculateCashback(sale.total);

  const payload: SaleConfirmedPayload = {
    tenantId,
    saleId,
    clientId: sale.clientId,
    total: sale.total,
    items: sale.items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
    })),
  };

  return saleRepository.confirmAtomic({
    tenantId,
    saleId,
    cashback:
      cashbackAmount > 0
        ? {
            clientId: sale.clientId,
            amount: cashbackAmount,
            expiresAt: getCashbackExpiryDate(),
            originSaleId: saleId,
          }
        : undefined,
    stockDecrements: sale.items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
    })),
    eventType: EVENTS.SALE_CONFIRMED,
    eventPayload: payload as unknown as Record<string, unknown>,
  });
}
