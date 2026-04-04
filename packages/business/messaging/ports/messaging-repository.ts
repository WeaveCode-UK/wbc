export interface QuickReplyRepository {
  list(tenantId: string): Promise<unknown[]>;
  create(tenantId: string, label: string, text: string): Promise<unknown>;
  delete(tenantId: string, id: string): Promise<void>;
}

export interface ScheduledMessageRepository {
  create(tenantId: string, data: { clientId: string; message: string; sendAt: Date; type: string }): Promise<unknown>;
  findClient(tenantId: string, clientId: string): Promise<{ name: string; phone: string } | null>;
}

export interface PostSaleFlowRepository {
  deletePendingByClient(clientId: string): Promise<void>;
  createMany(flows: Array<{ saleId: string; clientId: string; stage: string; messageVariant: number; scheduledAt: Date; status: string }>): Promise<void>;
  findPending(limit: number): Promise<Array<{ id: string; clientId: string; stage: string; messageVariant: number; scheduledAt: Date }>>;
  markSent(id: string): Promise<void>;
}
