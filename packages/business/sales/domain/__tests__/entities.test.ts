import { describe, it, expect } from 'vitest';
import { calculateCashback, calculateSaleTotal, generateInstallments, getCashbackExpiryDate } from '../entities';

describe('Sales Domain', () => {
  it('calculates 5% cashback', () => {
    expect(calculateCashback(100)).toBe(5);
    expect(calculateCashback(200)).toBe(10);
    expect(calculateCashback(0)).toBe(0);
  });

  it('calculates sale total with discount and cashback', () => {
    const items = [{ quantity: 2, unitPrice: 50 }, { quantity: 1, unitPrice: 30 }];
    expect(calculateSaleTotal(items, 10, 5)).toBe(115); // 130 - 10 - 5
  });

  it('sale total does not go below zero', () => {
    const items = [{ quantity: 1, unitPrice: 10 }];
    expect(calculateSaleTotal(items, 50, 0)).toBe(0);
  });

  it('generates correct installments', () => {
    const installments = generateInstallments(300, 3, new Date('2026-01-01'));
    expect(installments).toHaveLength(3);
    expect(installments[0]?.amount).toBe(100);
    const totalAmount = installments.reduce((sum, i) => sum + i.amount, 0);
    expect(totalAmount).toBe(300);
  });

  it('cashback expires in 90 days', () => {
    const expiryDate = getCashbackExpiryDate();
    const daysUntilExpiry = Math.round((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    expect(daysUntilExpiry).toBeGreaterThanOrEqual(89);
    expect(daysUntilExpiry).toBeLessThanOrEqual(91);
  });
});
