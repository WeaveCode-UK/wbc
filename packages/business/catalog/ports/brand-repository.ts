import type { Brand } from '../domain/entities';

export interface BrandRepository {
  list(): Promise<Brand[]>;
  findById(id: string): Promise<Brand | null>;
}
