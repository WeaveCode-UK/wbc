import { isOtpExpired, isOtpUsed } from '../domain/otp';
import { OtpExpiredError, OtpInvalidError, OtpAlreadyUsedError, OtpTooManyAttemptsError } from '../domain/errors';
import type { OtpRepository } from '../ports/otp-repository';

const MAX_FAILED_ATTEMPTS = 5;

export interface VerifyOtpInput {
  phone: string;
  code: string;
}

export interface VerifyOtpResult {
  valid: boolean;
}

export async function verifyOtp(
  input: VerifyOtpInput,
  otpRepository: OtpRepository,
): Promise<VerifyOtpResult> {
  const failedAttempts = await otpRepository.getFailedAttempts(input.phone);
  if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
    throw new OtpTooManyAttemptsError();
  }

  const otp = await otpRepository.findLatestByPhone(input.phone);

  if (!otp || otp.code !== input.code) {
    await otpRepository.incrementFailedAttempts(input.phone);
    throw new OtpInvalidError();
  }

  if (isOtpUsed(otp)) {
    throw new OtpAlreadyUsedError();
  }

  if (isOtpExpired(otp)) {
    throw new OtpExpiredError();
  }

  await otpRepository.markAsUsed(otp.id);
  await otpRepository.resetFailedAttempts(input.phone);

  return { valid: true };
}
