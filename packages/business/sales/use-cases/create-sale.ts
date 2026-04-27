import type { Sale } from "../domain/entities";
import { calculateSaleTotal } from "../domain/entities";
import type { SaleRepository } from "../ports/sale-repository";
import type { CashbackRepository } from "../ports/cashback-repository";
import { InsufficientCashbackError } from "../domain/errors";
import { withSpan } from "@wbc/shared";

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

// ACH-021 seguranca: createSale must reject when the requested
// cashbackUsed exceeds the client's available balance. The historical
// signature (input, saleRepository) created sales with arbitrary
// cashbackUsed and then never debited the balance — letting any
// authenticated tenant member zero out totals at will. The cashback
// debit itself is applied atomically in confirmAtomic (see confirm-sale).
export async function createSale(
  input: CreateSaleInput,
  saleRepository: SaleRepository,
  cashbackRepository: CashbackRepository,
): Promise<Sale> {
  return withSpan(
    "sales.createSale",
    {
      "wbc.tenantId": input.tenantId,
      "wbc.clientId": input.clientId,
      "wbc.items.count": input.items.length,
    },
    async () => {
      const cashbackUsed = input.cashbackUsed ?? 0;
      if (cashbackUsed > 0) {
        const { available } = await cashbackRepository.getBalance(
          input.tenantId,
          input.clientId,
        );
        if (cashbackUsed > available) {
          throw new InsufficientCashbackError();
        }
      }

      const total = calculateSaleTotal(
        input.items,
        input.discount ?? 0,
        cashbackUsed,
      );

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
    },
  );
}
