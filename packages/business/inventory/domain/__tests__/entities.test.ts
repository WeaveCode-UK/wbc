import { describe, it, expect } from 'vitest';
import { isStockLow, isStockDepleted } from '../entities';
import type { Stock } from '../entities';

describe('Inventory Domain', () => {
  it('detects low stock', () => {
    const stock: Stock = { id: '1', tenantId: 't1', productId: 'p1', quantity: 3, minAlert: 5 };
    expect(isStockLow(stock)).toBe(true);
  });

  it('does not flag stock above alert', () => {
    const stock: Stock = { id: '1', tenantId: 't1', productId: 'p1', quantity: 10, minAlert: 5 };
    expect(isStockLow(stock)).toBe(false);
  });

  it('detects depleted stock', () => {
    const stock: Stock = { id: '1', tenantId: 't1', productId: 'p1', quantity: 0, minAlert: 5 };
    expect(isStockDepleted(stock)).toBe(true);
  });

  it('no alert if minAlert is 0', () => {
    const stock: Stock = { id: '1', tenantId: 't1', productId: 'p1', quantity: 1, minAlert: 0 };
    expect(isStockLow(stock)).toBe(false);
  });
});
