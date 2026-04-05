import { describe, it, expect } from 'vitest';
import { validatePhone, formatPhoneE164 } from '../value-objects';
import { calculateClassification as calcClass } from '../entities';

describe('Client Value Objects', () => {
  describe('validatePhone', () => {
    it('accepts valid E.164 phone', () => {
      expect(validatePhone('+5511999999999')).toBe(true);
    });

    it('accepts phone without +', () => {
      expect(validatePhone('5511999999999')).toBe(true);
    });

    it('rejects empty string', () => {
      expect(validatePhone('')).toBe(false);
    });

    it('rejects letters', () => {
      expect(validatePhone('abc')).toBe(false);
    });

    it('rejects phone starting with 0', () => {
      expect(validatePhone('011999999999')).toBe(false);
    });

    it('rejects single digit', () => {
      expect(validatePhone('5')).toBe(false);
    });
  });

  describe('formatPhoneE164', () => {
    it('adds +55 to 11-digit BR phone', () => {
      expect(formatPhoneE164('11999999999')).toBe('+5511999999999');
    });

    it('keeps + for already formatted phone', () => {
      expect(formatPhoneE164('+5511999999999')).toBe('+5511999999999');
    });

    it('handles 55-prefixed phone', () => {
      expect(formatPhoneE164('5511999999999')).toBe('+5511999999999');
    });

    it('strips non-digit characters', () => {
      expect(formatPhoneE164('(11) 99999-9999')).toBe('+5511999999999');
    });

    it('adds +55 to 10-digit phone (landline)', () => {
      expect(formatPhoneE164('1133334444')).toBe('+551133334444');
    });
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
