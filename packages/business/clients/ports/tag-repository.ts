import type { Tag, ClientTag } from '../domain/entities';

export interface TagRepository {
  findById(tenantId: string, id: string): Promise<Tag | null>;
  findByName(tenantId: string, name: string): Promise<Tag | null>;
  list(tenantId: string): Promise<Tag[]>;
  create(data: { tenantId: string; name: string; color?: string; autoRule?: string }): Promise<Tag>;
  delete(tenantId: string, id: string): Promise<void>;
  tagClient(clientId: string, tagId: string): Promise<ClientTag>;
  untagClient(clientId: string, tagId: string): Promise<void>;
  bulkTag(clientIds: string[], tagId: string): Promise<number>;
  getClientTags(clientId: string): Promise<Tag[]>;
}
