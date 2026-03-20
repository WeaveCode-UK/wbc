import type { Product } from '../domain/entities';

export interface ProductRepository {
  findById(tenantId: string, id: string): Promise<Product | null>;
  list(tenantId: string, filters: { brandId?: string; search?: string; category?: string }): Promise<Product[]>;
  create(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product>;
  update(tenantId: string, id: string, data: Partial<Product>): Promise<Product>;
  delete(tenantId: string, id: string): Promise<void>;
  getTopProducts(tenantId: string, limit: number): Promise<Array<Product & { salesCount: number }>>;
}
