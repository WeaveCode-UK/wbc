import { describe, it, expect } from 'vitest';
import { validatePhone, formatPhoneE164 } from '../value-objects';
import { calculateClassification as calcClass } from '../entities';

describe('Client Value Objects', () => {
  it('validates E.164 phone numbers', () => {
    expect(validatePhone('+5511999999999')).toBe(true);
    expect(validatePhone('5511999999999')).toBe(true);
    expect(validatePhone('abc')).toBe(false);
    expect(validatePhone('')).toBe(false);
  });

  it('formats phone to E.164', () => {
    expect(formatPhoneE164('11999999999')).toBe('+5511999999999');
    expect(formatPhoneE164('5511999999999')).toBe('+5511999999999');
    expect(formatPhoneE164('+5511999999999')).toBe('+5511999999999');
  });
});

describe('Client Classification', () => {
  it('classifies as A for high-value clients', () => {
    expect(calcClass(5, 500)).toBe('A');
    expect(calcClass(10, 1000)).toBe('A');
  });

  it('classifies as B for regular clients', () => {
    expect(calcClass(2, 100)).toBe('B');
    expect(calcClass(3, 200)).toBe('B');
  });

  it('classifies as C for sporadic clients', () => {
    expect(calcClass(1, 50)).toBe('C');
    expect(calcClass(0, 0)).toBe('C');
  });
});
