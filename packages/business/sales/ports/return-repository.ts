export interface SaleReturn {
  id: string;
  saleId: string;
  reason: string;
  refundAmount: number;
  createdAt: Date;
}

export interface ReturnRepository {
  create(
    saleId: string,
    reason: string,
    refundAmount: number,
  ): Promise<SaleReturn>;
  // ACH-024 seguranca: needed by createReturn to enforce
  // sum(refunds) <= sale.total. Without it, a single sale could be
  // refunded an unbounded number of times.
  findBySaleId(tenantId: string, saleId: string): Promise<SaleReturn[]>;
  // F11.E15: tenant-wide list for the /sales/returns page.
  listByTenant(tenantId: string, limit?: number): Promise<SaleReturn[]>;
}
