import { isOtpExpired, isOtpUsed } from '../domain/otp';
import { OtpExpiredError, OtpInvalidError, OtpAlreadyUsedError, OtpTooManyAttemptsError } from '../domain/errors';
import type { OtpRepository } from '../ports/otp-repository';
import { logSecurityEvent } from '@wbc/shared';

// Auth 2.0: Updated to use accountId instead of phone.

const MAX_FAILED_ATTEMPTS = 5;

export interface VerifyOtpInput {
  accountId: string;
  code: string;
}

export interface VerifyOtpResult {
  valid: boolean;
}

export async function verifyOtp(
  input: VerifyOtpInput,
  otpRepository: OtpRepository,
): Promise<VerifyOtpResult> {
  const failedAttempts = await otpRepository.getFailedAttempts(input.accountId);
  if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
    logSecurityEvent({ event: 'otp.verify.locked', userId: input.accountId, success: false, detail: `${failedAttempts} failed attempts` });
    throw new OtpTooManyAttemptsError();
  }

  const otp = await otpRepository.findLatestByAccountId(input.accountId);

  if (!otp || otp.code !== input.code) {
    await otpRepository.incrementFailedAttempts(input.accountId);
    logSecurityEvent({ event: 'otp.verify.failed', userId: input.accountId, success: false, detail: 'invalid code' });
    throw new OtpInvalidError();
  }

  if (isOtpUsed(otp)) {
    throw new OtpAlreadyUsedError();
  }

  if (isOtpExpired(otp)) {
    throw new OtpExpiredError();
  }

  await otpRepository.markAsUsed(otp.id);
  await otpRepository.resetFailedAttempts(input.accountId);

  logSecurityEvent({ event: 'otp.verify.success', userId: input.accountId, success: true });
  return { valid: true };
}
