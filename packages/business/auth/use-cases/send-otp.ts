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

  // In dev mode, log to console. WhatsApp integration comes in Phase 3.
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log(`[DEV] OTP for ${input.phone}: ${code}`);
  }

  return { success: true, code };
}
