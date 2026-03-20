import type { Brand } from '../domain/entities';
import type { BrandRepository } from '../ports/brand-repository';

export async function listBrands(brandRepo: BrandRepository): Promise<Brand[]> {
  return brandRepo.list();
}
