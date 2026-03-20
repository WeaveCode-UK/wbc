import type { Cashback } from '../domain/entities';
import type { CashbackRepository } from '../ports/cashback-repository';

export async function getCashbackBalance(
  tenantId: string,
  clientId: string,
  cashbackRepo: CashbackRepository,
): Promise<{ available: number; expiring: Cashback[] }> {
  return cashbackRepo.getBalance(tenantId, clientId);
}
