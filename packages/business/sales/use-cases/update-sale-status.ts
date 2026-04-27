import type { Sale } from "../domain/entities";
import type { SaleRepository } from "../ports/sale-repository";
import { SaleNotFoundError, InvalidSaleStatusError } from "../domain/errors";
import { isValidSaleTransition, SALE_STATUSES } from "../domain/status";
import type { SaleStatus } from "../domain/value-objects";
import { publish, EVENTS } from "@wbc/shared";
import type { SaleStatusChangedPayload } from "../domain/events";

export async function updateSaleStatus(
  tenantId: string,
  saleId: string,
  newStatus: string,
  saleRepository: SaleRepository,
): Promise<Sale> {
  const sale = await saleRepository.findById(tenantId, saleId);
  if (!sale) throw new SaleNotFoundError(saleId);

  // ACH-022 seguranca: enforce the SaleStatus state machine.
  // Without this, any transition was accepted — including DRAFT →
  // DELIVERED (skipping payment/separation), CANCELLED → CONFIRMED
  // (resurrecting cancelled orders) and DELIVERED → DRAFT (rewinding
  // terminal states) — and downstream events fired as if legitimate.
  if (!SALE_STATUSES.includes(newStatus as SaleStatus)) {
    throw new InvalidSaleStatusError(sale.status, newStatus);
  }
  if (
    !isValidSaleTransition(sale.status as SaleStatus, newStatus as SaleStatus)
  ) {
    throw new InvalidSaleStatusError(sale.status, newStatus);
  }

  const updated = await saleRepository.updateStatus(
    tenantId,
    saleId,
    newStatus,
  );

  await publish<SaleStatusChangedPayload>(
    EVENTS.SALE_STATUS_CHANGED,
    tenantId,
    {
      tenantId,
      saleId,
      oldStatus: sale.status,
      newStatus,
    },
  );

  return updated;
}
