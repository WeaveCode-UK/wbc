import { describe, it, expect } from 'vitest';
import { generateOtpCode, isOtpExpired, isOtpUsed, getOtpExpirationDate } from '../otp';
import type { OtpCode } from '../otp';

describe('OTP Domain', () => {
  it('generates a 6-digit code', () => {
    const code = generateOtpCode();
    expect(code).toHaveLength(6);
    expect(Number(code)).toBeGreaterThanOrEqual(100000);
    expect(Number(code)).toBeLessThan(1000000);
  });

  it('detects expired OTP', () => {
    const otp: OtpCode = { id: '1', phone: '+5511999', code: '123456', expiresAt: new Date(Date.now() - 1000), usedAt: null, createdAt: new Date() };
    expect(isOtpExpired(otp)).toBe(true);
  });

  it('detects non-expired OTP', () => {
    const otp: OtpCode = { id: '1', phone: '+5511999', code: '123456', expiresAt: new Date(Date.now() + 60000), usedAt: null, createdAt: new Date() };
    expect(isOtpExpired(otp)).toBe(false);
  });

  it('detects used OTP', () => {
    const otp: OtpCode = { id: '1', phone: '+5511999', code: '123456', expiresAt: new Date(Date.now() + 60000), usedAt: new Date(), createdAt: new Date() };
    expect(isOtpUsed(otp)).toBe(true);
  });

  it('generates expiration date 5 minutes from now', () => {
    const before = Date.now();
    const expiresAt = getOtpExpirationDate();
    const after = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + fiveMinutes - 100);
    expect(expiresAt.getTime()).toBeLessThanOrEqual(after + fiveMinutes + 100);
  });
});
