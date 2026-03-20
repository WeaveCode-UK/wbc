import { isOtpExpired, isOtpUsed } from '../domain/otp';
import { OtpExpiredError, OtpInvalidError, OtpAlreadyUsedError } from '../domain/errors';
import type { OtpRepository } from '../ports/otp-repository';

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
  const otp = await otpRepository.findLatestByPhone(input.phone);

  if (!otp || otp.code !== input.code) {
    throw new OtpInvalidError();
  }

  if (isOtpUsed(otp)) {
    throw new OtpAlreadyUsedError();
  }

  if (isOtpExpired(otp)) {
    throw new OtpExpiredError();
  }

  await otpRepository.markAsUsed(otp.id);

  return { valid: true };
}
