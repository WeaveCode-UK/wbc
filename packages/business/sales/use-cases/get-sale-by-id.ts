import type { Sale, SaleItem } from '../domain/entities';
import type { SaleRepository } from '../ports/sale-repository';
import { SaleNotFoundError } from '../domain/errors';

export async function getSaleById(
  tenantId: string,
  id: string,
  saleRepository: SaleRepository,
): Promise<Sale & { items: SaleItem[] }> {
  const sale = await saleRepository.findById(tenantId, id);
  if (!sale) throw new SaleNotFoundError(id);
  return sale;
}
