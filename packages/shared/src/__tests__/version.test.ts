import { describe, it, expect } from 'vitest';
import { API_VERSION, MIN_MOBILE_VERSION } from '../version';

describe('Health Router contracts', () => {
  it('API_VERSION is semver format', () => {
    expect(API_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('MIN_MOBILE_VERSION is semver format', () => {
    expect(MIN_MOBILE_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('API_VERSION >= MIN_MOBILE_VERSION', () => {
    const toNum = (v: string) => v.split('.').reduce((a, b, i) => a + Number(b) * Math.pow(1000, 2 - i), 0);
    expect(toNum(API_VERSION)).toBeGreaterThanOrEqual(toNum(MIN_MOBILE_VERSION));
  });
});
