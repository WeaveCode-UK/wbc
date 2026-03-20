import { prisma } from '@wbc/db';
import type { OtpRepository } from '../ports/otp-repository';
import type { OtpCode } from '../domain/otp';

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
}
