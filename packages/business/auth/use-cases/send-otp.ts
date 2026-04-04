import { generateOtpCode, getOtpExpirationDate } from '../domain/otp';
import { OtpSendRateLimitError } from '../domain/errors';
import type { OtpRepository } from '../ports/otp-repository';

const MAX_SENDS_PER_HOUR = 3;

export interface SendOtpInput {
  phone: string;
}

export interface SendOtpResult {
  success: boolean;
  code: string; // returned for dev mode logging only
}

export async function sendOtp(
  input: SendOtpInput,
  otpRepository: OtpRepository,
): Promise<SendOtpResult> {
  const sendCount = await otpRepository.getSendCount(input.phone);
  if (sendCount >= MAX_SENDS_PER_HOUR) {
    throw new OtpSendRateLimitError();
  }

  // Delete any expired OTPs for this phone
  await otpRepository.deleteExpiredByPhone(input.phone);

  const code = generateOtpCode();
  const expiresAt = getOtpExpirationDate();

  await otpRepository.create(input.phone, code, expiresAt);
  await otpRepository.incrementSendCount(input.phone);

  // Log OTP sent event without the code itself
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log(`[DEV] OTP sent to ${input.phone}`);
  }

  return { success: true, code };
}
