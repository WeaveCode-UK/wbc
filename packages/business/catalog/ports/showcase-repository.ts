import type { Showcase } from '../domain/entities';

export interface ShowcaseRepository {
  findById(tenantId: string, id: string): Promise<Showcase | null>;
  findByShareLink(shareLink: string): Promise<Showcase | null>;
  list(tenantId: string): Promise<Showcase[]>;
  create(data: { tenantId: string; name: string; clientId?: string; shareLink: string; productIds: string[] }): Promise<Showcase>;
  update(tenantId: string, id: string, data: Partial<Showcase>): Promise<Showcase>;
  delete(tenantId: string, id: string): Promise<void>;
}
