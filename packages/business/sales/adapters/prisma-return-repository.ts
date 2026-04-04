import { prisma } from '@wbc/db';
import type { ReturnRepository } from '../ports/return-repository';

export class PrismaReturnRepository implements ReturnRepository {
  async create(saleId: string, reason: string, refundAmount: number) {
    return prisma.return.create({
      data: { saleId, reason, refundAmount },
    });
  }
}
