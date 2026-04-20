import { generateOtpCode, getOtpExpirationDate } from "../domain/otp";
import { OtpSendRateLimitError } from "../domain/errors";
import type { OtpRepository } from "../ports/otp-repository";
import { logSecurityEvent } from "@wbc/shared";

// Auth 2.0: Updated to use accountId instead of phone.

const MAX_SENDS_PER_HOUR = 3;

export interface SendOtpInput {
  accountId: string;
}

export interface SendOtpResult {
  success: boolean;
}

export async function sendOtp(
  input: SendOtpInput,
  otpRepository: OtpRepository,
): Promise<SendOtpResult> {
  const sendCount = await otpRepository.getSendCount(input.accountId);
  if (sendCount >= MAX_SENDS_PER_HOUR) {
    logSecurityEvent({
      event: "otp.send.rate_limited",
      accountId: input.accountId,
      success: false,
      detail: `${sendCount} sends in last hour`,
    });
    throw new OtpSendRateLimitError();
  }

  await otpRepository.deleteExpiredByAccountId(input.accountId);

  // OTP code is generated, persisted, and consumed only by the configured
  // delivery channel (e-mail/SMS). It is never returned to the caller, never
  // logged — even in development — to keep it out of stdout, log aggregators,
  // and any caller that might inadvertently surface it (ACH-002).
  const code = generateOtpCode();
  const expiresAt = getOtpExpirationDate();

  await otpRepository.create(input.accountId, code, expiresAt);
  await otpRepository.incrementSendCount(input.accountId);

  logSecurityEvent({
    event: "otp.send",
    accountId: input.accountId,
    success: true,
  });
  return { success: true };
}
