import { prisma } from '@wbc/db';
import Redis from 'ioredis';
import type { OtpRepository } from '../ports/otp-repository';
import type { OtpCode } from '../domain/otp';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379/0';
let redisInstance: Redis | undefined;
function getRedis(): Redis {
  if (!redisInstance) {
    redisInstance = new Redis(REDIS_URL, { maxRetriesPerRequest: 3 });
  }
  return redisInstance;
}

const OTP_LOCKOUT_WINDOW = 900; // 15 minutes in seconds
const OTP_MAX_ATTEMPTS = 5;

export class PrismaOtpRepository implements OtpRepository {
  async create(phone: string, code: string, expiresAt: Date): Promise<OtpCode> {
    const otp = await prisma.otpCode.create({
      data: { phone, code, expiresAt },
    });
    return {
      id: otp.id,
      phone: otp.phone,
      code: otp.code,
      expiresAt: otp.expiresAt,
      usedAt: otp.usedAt,
      createdAt: otp.createdAt,
    };
  }

  async findLatestByPhone(phone: string): Promise<OtpCode | null> {
    const otp = await prisma.otpCode.findFirst({
      where: { phone },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp) return null;
    return {
      id: otp.id,
      phone: otp.phone,
      code: otp.code,
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

  async deleteExpiredByPhone(phone: string): Promise<void> {
    await prisma.otpCode.deleteMany({
      where: {
        phone,
        expiresAt: { lt: new Date() },
      },
    });
  }

  async getFailedAttempts(phone: string): Promise<number> {
    const redis = getRedis();
    const count = await redis.get(`otp:fail:${phone}`);
    return count ? parseInt(count, 10) : 0;
  }

  async incrementFailedAttempts(phone: string): Promise<void> {
    const redis = getRedis();
    const key = `otp:fail:${phone}`;
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, OTP_LOCKOUT_WINDOW);
    }
  }

  async resetFailedAttempts(phone: string): Promise<void> {
    const redis = getRedis();
    await redis.del(`otp:fail:${phone}`);
  }
}
