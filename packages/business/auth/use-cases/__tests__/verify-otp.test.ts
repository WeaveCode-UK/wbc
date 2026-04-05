import { describe, it, expect, vi } from 'vitest';
import { verifyOtp } from '../verify-otp';
import type { OtpRepository } from '../../ports/otp-repository';
import { OtpInvalidError, OtpExpiredError, OtpAlreadyUsedError, OtpTooManyAttemptsError } from '../../domain/errors';

vi.mock('@wbc/shared', () => ({ logSecurityEvent: vi.fn() }));

function mockOtpRepo(otp: Record<string, unknown> | null = null, failedAttempts = 0): OtpRepository {
  return {
    getSendCount: vi.fn().mockResolvedValue(0),
    deleteExpiredByAccountId: vi.fn(),
    create: vi.fn(),
    incrementSendCount: vi.fn(),
    findLatestByAccountId: vi.fn().mockResolvedValue(otp),
    getFailedAttempts: vi.fn().mockResolvedValue(failedAttempts),
    incrementFailedAttempts: vi.fn().mockResolvedValue(undefined),
    resetFailedAttempts: vi.fn().mockResolvedValue(undefined),
    markAsUsed: vi.fn().mockResolvedValue(undefined),
  };
}

describe('verifyOtp use-case', () => {
  it('verifies a valid OTP', async () => {
    const otp = { id: 'o1', code: '123456', expiresAt: new Date(Date.now() + 60000), usedAt: null };
    const repo = mockOtpRepo(otp);
    const result = await verifyOtp({ accountId: 'a1', code: '123456' }, repo);
    expect(result.valid).toBe(true);
    expect(repo.markAsUsed).toHaveBeenCalledWith('o1');
    expect(repo.resetFailedAttempts).toHaveBeenCalledWith('a1');
  });

  it('throws OtpInvalidError for wrong code', async () => {
    const otp = { id: 'o1', code: '123456', expiresAt: new Date(Date.now() + 60000), usedAt: null };
    const repo = mockOtpRepo(otp);
    await expect(verifyOtp({ accountId: 'a1', code: '000000' }, repo)).rejects.toThrow(OtpInvalidError);
    expect(repo.incrementFailedAttempts).toHaveBeenCalledWith('a1');
  });

  it('throws OtpInvalidError when no OTP found', async () => {
    const repo = mockOtpRepo(null);
    await expect(verifyOtp({ accountId: 'a1', code: '123456' }, repo)).rejects.toThrow(OtpInvalidError);
  });

  it('throws OtpExpiredError for expired OTP', async () => {
    const otp = { id: 'o1', code: '123456', expiresAt: new Date(Date.now() - 1000), usedAt: null };
    const repo = mockOtpRepo(otp);
    await expect(verifyOtp({ accountId: 'a1', code: '123456' }, repo)).rejects.toThrow(OtpExpiredError);
  });

  it('throws OtpAlreadyUsedError for used OTP', async () => {
    const otp = { id: 'o1', code: '123456', expiresAt: new Date(Date.now() + 60000), usedAt: new Date() };
    const repo = mockOtpRepo(otp);
    await expect(verifyOtp({ accountId: 'a1', code: '123456' }, repo)).rejects.toThrow(OtpAlreadyUsedError);
  });

  it('throws OtpTooManyAttemptsError after 5 failed attempts', async () => {
    const repo = mockOtpRepo(null, 5);
    await expect(verifyOtp({ accountId: 'a1', code: '123456' }, repo)).rejects.toThrow(OtpTooManyAttemptsError);
    expect(repo.findLatestByAccountId).not.toHaveBeenCalled();
  });
});
