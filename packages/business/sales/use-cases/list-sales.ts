import type { Sale } from '../domain/entities';
import type { SaleRepository } from '../ports/sale-repository';

export async function listSales(
  tenantId: string,
  filters: { status?: string; clientId?: string; page: number; limit: number },
  saleRepository: SaleRepository,
): Promise<{ data: Sale[]; total: number }> {
  return saleRepository.list(tenantId, filters);
}
