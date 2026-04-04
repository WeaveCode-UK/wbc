import { calculateMargin, calculateGoalReverse } from '../domain/entities';
import type { FinanceRepository } from '../ports/finance-repository';

export function getMargin(costPrice: number, salePrice: number) {
  return calculateMargin(costPrice, salePrice);
}

export function getGoalReverse(targetIncome: number, avgMarginPercentage: number) {
  return calculateGoalReverse(targetIncome, avgMarginPercentage);
}

export async function getCAC(tenantId: string, clientId: string | undefined, repo: FinanceRepository) {
  return repo.getCAC(tenantId, clientId);
}
