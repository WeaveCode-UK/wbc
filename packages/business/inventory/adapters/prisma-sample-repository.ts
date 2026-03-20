import { prisma } from '@wbc/db';
import type { SampleRepository } from '../ports/sample-repository';
import type { Sample } from '../domain/entities';

export class PrismaSampleRepository implements SampleRepository {
  async list(tenantId: string, page: number, limit: number) {
    const where = { tenantId };
    const [data, total] = await Promise.all([
      prisma.sample.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.sample.count({ where }),
    ]);
    return { data: data.map((s) => ({ ...s, cost: Number(s.cost) })) as Sample[], total };
  }

  async create(data: { tenantId: string; productId: string; clientId?: string; quantity: number; cost: number }): Promise<Sample> {
    const sample = await prisma.sample.create({ data });
    return { ...sample, cost: Number(sample.cost) } as Sample;
  }

  async markConverted(tenantId: string, id: string): Promise<Sample> {
    const sample = await prisma.sample.update({ where: { id }, data: { resultedInSale: true } });
    return { ...sample, cost: Number(sample.cost) } as Sample;
  }

  async getROI(tenantId: string) {
    const [totalCostResult, convertedCount, totalSamples] = await Promise.all([
      prisma.sample.aggregate({ where: { tenantId }, _sum: { cost: true } }),
      prisma.sample.count({ where: { tenantId, resultedInSale: true } }),
      prisma.sample.count({ where: { tenantId } }),
    ]);
    return { totalCost: Number(totalCostResult._sum.cost ?? 0), convertedCount, totalSamples };
  }
}
