import type { Sale, SaleItem } from "../domain/entities";

export interface ConfirmAtomicParams {
  tenantId: string;
  saleId: string;
  /**
   * ACH-001 dados-persistencia: cashback record to create in the same
   * transaction. Passed as-is so the adapter doesn't need to know
   * about the cashback repository.
   */
  cashback?: {
    clientId: string;
    amount: number;
    expiresAt: Date;
    originSaleId: string;
  };
  /**
   * ACH-001 dados-persistencia: stock decrements to apply in the same
   * transaction. Previously the inventory handler ran asynchronously
   * off SALE_CONFIRMED; if it failed, the sale stayed CONFIRMED and
   * stock didn't decrement, producing oversells.
   */
  stockDecrements: Array<{ productId: string; quantity: number }>;
  /**
   * ACH-001 dados-persistencia: outbox event payload emitted atomically
   * with the sale state change so the same tx that commits the sale
   * commits the event. Downstream handlers (notifications, post-sale
   * flow) still pick it up from the outbox as usual.
   */
  eventType: string;
  eventPayload: Record<string, unknown>;
  /**
   * ACH-021 seguranca: cashback debit applied inside the same
   * Serializable tx as the sale confirmation. saleId is reused as
   * idempotencyKey so retried confirmations don't double-spend.
   */
  cashback_debit?: {
    clientId: string;
    amount: number;
  };
}

export interface SaleRepository {
  findById(
    tenantId: string,
    id: string,
  ): Promise<(Sale & { items: SaleItem[] }) | null>;
  list(
    tenantId: string,
    filters: {
      status?: string;
      clientId?: string;
      page: number;
      limit: number;
    },
  ): Promise<{ data: Sale[]; total: number }>;
  create(data: {
    tenantId: string;
    clientId: string;
    items: Array<{ productId: string; quantity: number; unitPrice: number }>;
    paymentMethod?: string;
    discount?: number;
    cashbackUsed?: number;
    campaignId?: string;
    notes?: string;
  }): Promise<Sale>;
  updateStatus(tenantId: string, id: string, status: string): Promise<Sale>;
  /**
   * ACH-001 dados-persistencia: confirm sale + create cashback +
   * decrement stock + emit outbox event in a single Serializable
   * transaction. Either everything commits or nothing does.
   */
  confirmAtomic(params: ConfirmAtomicParams): Promise<Sale>;
  delete(tenantId: string, id: string): Promise<void>;
}
