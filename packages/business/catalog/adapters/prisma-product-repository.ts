import { prisma } from '@wbc/db';
import type { ProductRepository } from '../ports/product-repository';
import type { Product } from '../domain/entities';

export class PrismaProductRepository implements ProductRepository {
  async findById(tenantId: string, id: string): Promise<Product | null> {
    const p = await prisma.product.findFirst({ where: { id, tenantId } });
    return p ? { ...p, price: Number(p.price), costPrice: p.costPrice ? Number(p.costPrice) : null } : null;
  }

  async list(tenantId: string, filters: { brandId?: string; search?: string; category?: string }): Promise<Product[]> {
    const where: Record<string, unknown> = { tenantId, isActive: true };
    if (filters.brandId) where.brandId = filters.brandId;
    if (filters.category) where.category = filters.category;
    if (filters.search) where.name = { contains: filters.search, mode: 'insensitive' };
    const products = await prisma.product.findMany({ where, orderBy: { name: 'asc' } });
    return products.map((p) => ({ ...p, price: Number(p.price), costPrice: p.costPrice ? Number(p.costPrice) : null }));
  }

  async create(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const p = await prisma.product.create({ data });
    return { ...p, price: Number(p.price), costPrice: p.costPrice ? Number(p.costPrice) : null };
  }

  async update(tenantId: string, id: string, data: Partial<Product>): Promise<Product> {
    const p = await prisma.product.update({ where: { id }, data });
    return { ...p, price: Number(p.price), costPrice: p.costPrice ? Number(p.costPrice) : null };
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await prisma.product.update({ where: { id }, data: { isActive: false } });
  }

  async getTopProducts(tenantId: string, limit: number) {
    const products = await prisma.product.findMany({
      where: { tenantId, isActive: true },
      take: limit,
      orderBy: { name: 'asc' },
    });
    return products.map((p) => ({ ...p, price: Number(p.price), costPrice: p.costPrice ? Number(p.costPrice) : null, salesCount: 0 }));
  }
}
