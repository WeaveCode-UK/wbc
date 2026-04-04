import type { OtpCode } from '../domain/otp';

// Auth 2.0: Updated to use accountId instead of phone.
// Full OTP system will be refactored in F10.E03.

export interface OtpRepository {
  create(accountId: string, code: string, expiresAt: Date): Promise<OtpCode>;
  findLatestByAccountId(accountId: string): Promise<OtpCode | null>;
  markAsUsed(id: string): Promise<void>;
  deleteExpiredByAccountId(accountId: string): Promise<void>;
  getFailedAttempts(accountId: string): Promise<number>;
  incrementFailedAttempts(accountId: string): Promise<void>;
  resetFailedAttempts(accountId: string): Promise<void>;
  getSendCount(accountId: string): Promise<number>;
  incrementSendCount(accountId: string): Promise<void>;
}
