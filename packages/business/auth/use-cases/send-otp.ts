import { generateOtpCode, getOtpExpirationDate } from '../domain/otp';
import { OtpSendRateLimitError } from '../domain/errors';
import type { OtpRepository } from '../ports/otp-repository';
import { logSecurityEvent } from '@wbc/shared';

// Auth 2.0: Updated to use accountId instead of phone.

const MAX_SENDS_PER_HOUR = 3;

export interface SendOtpInput {
  accountId: string;
}

export interface SendOtpResult {
  success: boolean;
  code: string; // returned for dev mode logging only
}

export async function sendOtp(
  input: SendOtpInput,
  otpRepository: OtpRepository,
): Promise<SendOtpResult> {
  const sendCount = await otpRepository.getSendCount(input.accountId);
  if (sendCount >= MAX_SENDS_PER_HOUR) {
    logSecurityEvent({ event: 'otp.send.rate_limited', userId: input.accountId, success: false, detail: `${sendCount} sends in last hour` });
    throw new OtpSendRateLimitError();
  }

  await otpRepository.deleteExpiredByAccountId(input.accountId);

  const code = generateOtpCode();
  const expiresAt = getOtpExpirationDate();

  await otpRepository.create(input.accountId, code, expiresAt);
  await otpRepository.incrementSendCount(input.accountId);

  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log(`[DEV] OTP sent for account ${input.accountId}`);
  }

  logSecurityEvent({ event: 'otp.send', userId: input.accountId, success: true });
  return { success: true, code };
}
