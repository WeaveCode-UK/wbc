import { randomInt } from 'crypto';

export interface OtpCode {
  id: string;
  phone: string;
  code: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export function generateOtpCode(): string {
  return String(randomInt(100000, 999999));
}

export function isOtpExpired(otp: OtpCode): boolean {
  return new Date() > otp.expiresAt;
}

export function isOtpUsed(otp: OtpCode): boolean {
  return otp.usedAt !== null;
}

export function getOtpExpirationDate(): Date {
  const now = new Date();
  return new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes
}
