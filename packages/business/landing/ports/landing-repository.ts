import type { LandingPageEntity } from '../domain/entities';

export interface LandingRepository {
  findByTenantId(tenantId: string): Promise<LandingPageEntity | null>;
  findBySlug(slug: string): Promise<LandingPageEntity | null>;
  upsert(tenantId: string, data: Omit<LandingPageEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<LandingPageEntity>;
  toggleActive(tenantId: string, isActive: boolean): Promise<LandingPageEntity>;
}
