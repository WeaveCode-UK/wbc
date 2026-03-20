import { prisma } from '@wbc/db';
import type { BrandRepository } from '../ports/brand-repository';
import type { Brand } from '../domain/entities';

export class PrismaBrandRepository implements BrandRepository {
  async list(): Promise<Brand[]> {
    const brands = await prisma.brand.findMany({ orderBy: { name: 'asc' } });
    return brands as Brand[];
  }

  async findById(id: string): Promise<Brand | null> {
    const brand = await prisma.brand.findUnique({ where: { id } });
    return brand as Brand | null;
  }
}
