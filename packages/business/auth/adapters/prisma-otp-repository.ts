import { prisma } from "@wbc/db";
import type { RedisLike } from "@wbc/shared";
import type { OtpRepository } from "../ports/otp-repository";
import type { OtpCode } from "../domain/otp";

// Auth 2.0: Updated to use accountId instead of phone.
// Full OTP system will be refactored in F10.E03.

// ACH-022: Redis client is injected by the composition root instead of each
// adapter lazy-creating its own singleton — otherwise two `ioredis`
// instances with divergent retry/timeout policies end up in the process.

const OTP_LOCKOUT_WINDOW = 900; // 15 minutes in seconds
const OTP_SEND_WINDOW = 3600; // 1 hour in seconds

export class PrismaOtpRepository implements OtpRepository {
  constructor(private readonly redis: RedisLike) {}

  async create(
    accountId: string,
    code: string,
    expiresAt: Date,
  ): Promise<OtpCode> {
    const otp = await prisma.otpCode.create({
      data: { accountId, code, expiresAt, purpose: "TWO_FACTOR" },
    });
    return {
      id: otp.id,
      accountId: otp.accountId,
      code: otp.code,
      purpose: otp.purpose,
      expiresAt: otp.expiresAt,
      usedAt: otp.usedAt,
      createdAt: otp.createdAt,
    };
  }

  async findLatestByAccountId(accountId: string): Promise<OtpCode | null> {
    const otp = await prisma.otpCode.findFirst({
      where: { accountId },
      orderBy: { createdAt: "desc" },
    });
    if (!otp) return null;
    return {
      id: otp.id,
      accountId: otp.accountId,
      code: otp.code,
      purpose: otp.purpose,
      expiresAt: otp.expiresAt,
      usedAt: otp.usedAt,
      createdAt: otp.createdAt,
    };
  }

  async markAsUsed(id: string): Promise<void> {
    await prisma.otpCode.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  async deleteExpiredByAccountId(accountId: string): Promise<void> {
    await prisma.otpCode.deleteMany({
      where: {
        accountId,
        expiresAt: { lt: new Date() },
      },
    });
  }

  async getFailedAttempts(accountId: string): Promise<number> {
    const count = await this.redis.get(`otp:fail:${accountId}`);
    return count ? parseInt(count, 10) : 0;
  }

  async incrementFailedAttempts(accountId: string): Promise<void> {
    const key = `otp:fail:${accountId}`;
    const current = await (
      this.redis as unknown as { incr(k: string): Promise<number> }
    ).incr(key);
    if (current === 1) {
      await this.redis.set(key, String(current), "EX", OTP_LOCKOUT_WINDOW);
    }
  }

  async resetFailedAttempts(accountId: string): Promise<void> {
    await this.redis.del(`otp:fail:${accountId}`);
  }

  async getSendCount(accountId: string): Promise<number> {
    const count = await this.redis.get(`otp:send:${accountId}`);
    return count ? parseInt(count, 10) : 0;
  }

  async incrementSendCount(accountId: string): Promise<void> {
    const key = `otp:send:${accountId}`;
    const current = await (
      this.redis as unknown as { incr(k: string): Promise<number> }
    ).incr(key);
    if (current === 1) {
      await this.redis.set(key, String(current), "EX", OTP_SEND_WINDOW);
    }
  }
}
