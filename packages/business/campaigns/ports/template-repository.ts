export interface TemplateRepository {
  list(tenantId: string, category?: string): Promise<unknown[]>;
  create(tenantId: string, name: string, category: string, text: string): Promise<unknown>;
  update(tenantId: string, id: string, text: string): Promise<unknown>;
  delete(tenantId: string, id: string): Promise<void>;
  listCommunity(filters: { topic?: string; sort?: string; page: number; limit: number }): Promise<{ data: unknown[]; total: number }>;
  likeCommunity(id: string): Promise<unknown>;
  shareToFeed(tenantId: string, text: string, topic?: string): Promise<unknown>;
}
