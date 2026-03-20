import { generateOtpCode, getOtpExpirationDate } from '../domain/otp';
import type { OtpRepository } from '../ports/otp-repository';

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
  // Delete any expired OTPs for this phone
  await otpRepository.deleteExpiredByPhone(input.phone);

  const code = generateOtpCode();
  const expiresAt = getOtpExpirationDate();

  await otpRepository.create(input.phone, code, expiresAt);

  // In dev mode, log to console. WhatsApp integration comes in Phase 3.
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log(`[DEV] OTP for ${input.phone}: ${code}`);
  }

  return { success: true, code };
}
