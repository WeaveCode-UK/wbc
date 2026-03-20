import type { Client } from '../domain/entities';

export interface ClientFilters {
  search?: string;
  tagIds?: string[];
  classification?: string;
  isLead?: boolean;
  isActive?: boolean;
}

export interface ClientRepository {
  findById(tenantId: string, id: string): Promise<Client | null>;
  findByPhone(tenantId: string, phone: string): Promise<Client | null>;
  list(tenantId: string, filters: ClientFilters, page: number, limit: number): Promise<{ data: Client[]; total: number }>;
  create(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'engagementScore' | 'classification' | 'firstPurchaseAt'>): Promise<Client>;
  update(tenantId: string, id: string, data: Partial<Client>): Promise<Client>;
  delete(tenantId: string, id: string): Promise<void>;
  count(tenantId: string): Promise<number>;
  listLeads(tenantId: string, page: number, limit: number): Promise<{ data: Client[]; total: number }>;
  convertToClient(tenantId: string, id: string): Promise<Client>;
  bulkEditNames(tenantId: string, edits: Array<{ id: string; name: string }>): Promise<number>;
}
