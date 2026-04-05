import { describe, it, expect, vi } from 'vitest';
import { sendOtp } from '../send-otp';
import type { OtpRepository } from '../../ports/otp-repository';
import { OtpSendRateLimitError } from '../../domain/errors';

vi.mock('@wbc/shared', () => ({ logSecurityEvent: vi.fn() }));

function mockOtpRepo(sendCount = 0): OtpRepository {
  return {
    getSendCount: vi.fn().mockResolvedValue(sendCount),
    deleteExpiredByAccountId: vi.fn().mockResolvedValue(undefined),
    create: vi.fn().mockResolvedValue(undefined),
    incrementSendCount: vi.fn().mockResolvedValue(undefined),
    findLatestByAccountId: vi.fn().mockResolvedValue(null),
    getFailedAttempts: vi.fn().mockResolvedValue(0),
    incrementFailedAttempts: vi.fn().mockResolvedValue(undefined),
    resetFailedAttempts: vi.fn().mockResolvedValue(undefined),
    markAsUsed: vi.fn().mockResolvedValue(undefined),
  };
}

describe('sendOtp use-case', () => {
  it('sends OTP successfully', async () => {
    const repo = mockOtpRepo(0);
    const result = await sendOtp({ accountId: 'a1' }, repo);
    expect(result.success).toBe(true);
    expect(result.code).toHaveLength(6);
    expect(repo.create).toHaveBeenCalledOnce();
    expect(repo.incrementSendCount).toHaveBeenCalledOnce();
  });

  it('deletes expired OTPs before creating new one', async () => {
    const repo = mockOtpRepo(0);
    await sendOtp({ accountId: 'a1' }, repo);
    expect(repo.deleteExpiredByAccountId).toHaveBeenCalledWith('a1');
  });

  it('throws OtpSendRateLimitError when max sends reached', async () => {
    const repo = mockOtpRepo(3);
    await expect(sendOtp({ accountId: 'a1' }, repo)).rejects.toThrow(OtpSendRateLimitError);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('allows sending when below limit', async () => {
    const repo = mockOtpRepo(2);
    const result = await sendOtp({ accountId: 'a1' }, repo);
    expect(result.success).toBe(true);
  });
});
