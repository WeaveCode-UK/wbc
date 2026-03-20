import type { OtpCode } from '../domain/otp';

export interface OtpRepository {
  create(phone: string, code: string, expiresAt: Date): Promise<OtpCode>;
  findLatestByPhone(phone: string): Promise<OtpCode | null>;
  markAsUsed(id: string): Promise<void>;
  deleteExpiredByPhone(phone: string): Promise<void>;
}
