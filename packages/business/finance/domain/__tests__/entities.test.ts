import { describe, it, expect } from 'vitest';
import { calculateMargin, calculateGoalReverse } from '../entities';

describe('Finance Domain', () => {
  it('calculates margin correctly', () => {
    const result = calculateMargin(60, 100);
    expect(result.margin).toBe(40);
    expect(result.percentage).toBe(40);
  });

  it('calculates goal reverse', () => {
    const result = calculateGoalReverse(5000, 30);
    expect(result.requiredSales).toBeCloseTo(16666.67, 1);
  });

  it('returns 0 for 0% margin', () => {
    const result = calculateGoalReverse(5000, 0);
    expect(result.requiredSales).toBe(0);
  });
});
