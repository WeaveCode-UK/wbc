export interface ReturnRepository {
  create(saleId: string, reason: string, refundAmount: number): Promise<unknown>;
}
