import type { Product } from '../domain/entities';
import type { ProductRepository } from '../ports/product-repository';
import { ProductNotFoundError } from '../domain/errors';

export async function listProducts(tenantId: string, filters: { brandId?: string; search?: string; category?: string }, productRepo: ProductRepository): Promise<Product[]> {
  return productRepo.list(tenantId, filters);
}

export async function createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>, productRepo: ProductRepository): Promise<Product> {
  return productRepo.create(data);
}

export async function updateProduct(tenantId: string, id: string, data: Partial<Product>, productRepo: ProductRepository): Promise<Product> {
  const existing = await productRepo.findById(tenantId, id);
  if (!existing) throw new ProductNotFoundError(id);
  return productRepo.update(tenantId, id, data);
}

export async function deleteProduct(tenantId: string, id: string, productRepo: ProductRepository): Promise<void> {
  const existing = await productRepo.findById(tenantId, id);
  if (!existing) throw new ProductNotFoundError(id);
  await productRepo.delete(tenantId, id);
}

export async function getTopProducts(tenantId: string, limit: number, productRepo: ProductRepository) {
  return productRepo.getTopProducts(tenantId, limit);
}
