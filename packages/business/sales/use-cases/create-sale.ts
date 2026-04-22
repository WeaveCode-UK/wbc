import type { Sale } from "../domain/entities";
import { calculateSaleTotal } from "../domain/entities";
import type { SaleRepository } from "../ports/sale-repository";
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

export async function createSale(
  input: CreateSaleInput,
  saleRepository: SaleRepository,
): Promise<Sale> {
  // ACH-009 observabilidade-operacao: piloto de span manual. Use-cases
  // críticos devem ter spans nomeados com atributos de negócio para
  // diagnóstico de latência interna (auto-instrumentação só pega borda).
  return withSpan(
    "sales.createSale",
    {
      "wbc.tenantId": input.tenantId,
      "wbc.clientId": input.clientId,
      "wbc.items.count": input.items.length,
    },
    async () => {
      const total = calculateSaleTotal(
        input.items,
        input.discount ?? 0,
        input.cashbackUsed ?? 0,
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
