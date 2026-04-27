import type { SaleRepository } from "../ports/sale-repository";
import type { ReturnRepository } from "../ports/return-repository";
import {
  SaleNotFoundError,
  RefundExceedsSaleTotalError,
  SaleNotRefundableError,
  InvalidRefundAmountError,
} from "../domain/errors";

export interface CreateReturnInput {
  tenantId: string;
  saleId: string;
  reason: string;
  refundAmount: number;
}

// ACH-024 seguranca: a sale can only be refunded once it is in a
// post-confirmation state. DRAFT and CANCELLED have no payment to
// reverse; refunds against them would mint money out of nothing.
const REFUNDABLE_STATUSES = [
  "CONFIRMED",
  "SEPARATED",
  "SHIPPED",
  "DELIVERED",
] as const;

export async function createReturn(
  input: CreateReturnInput,
  saleRepo: SaleRepository,
  returnRepo: ReturnRepository,
) {
  if (!(input.refundAmount > 0)) {
    throw new InvalidRefundAmountError();
  }

  const sale = await saleRepo.findById(input.tenantId, input.saleId);
  if (!sale) throw new SaleNotFoundError(input.saleId);

  if (
    !REFUNDABLE_STATUSES.includes(
      sale.status as (typeof REFUNDABLE_STATUSES)[number],
    )
  ) {
    throw new SaleNotRefundableError(sale.status);
  }

  // ACH-024 seguranca: enforce sum(refunds) <= sale.total. Without
  // this check, a single sale could be refunded an arbitrary number
  // of times — every call minted refundAmount out of nothing. The
  // accumulator includes only refunds already persisted; concurrent
  // duplicate calls are still possible without a Serializable tx
  // wrapping read+write (see observacoes for follow-up scope).
  const previous = await returnRepo.findBySaleId(input.tenantId, input.saleId);
  const alreadyRefunded = previous.reduce((sum, r) => sum + r.refundAmount, 0);
  if (alreadyRefunded + input.refundAmount > sale.total) {
    throw new RefundExceedsSaleTotalError(
      input.refundAmount,
      alreadyRefunded,
      sale.total,
    );
  }

  return returnRepo.create(input.saleId, input.reason, input.refundAmount);
}
