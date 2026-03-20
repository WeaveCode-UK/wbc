import { prisma } from '@wbc/db';
import type { ClientRepository, ClientFilters } from '../ports/client-repository';
import type { Client } from '../domain/entities';

export class PrismaClientRepository implements ClientRepository {
  async findById(tenantId: string, id: string): Promise<Client | null> {
    const client = await prisma.client.findFirst({ where: { id, tenantId } });
    return client as Client | null;
  }

  async findByPhone(tenantId: string, phone: string): Promise<Client | null> {
    const client = await prisma.client.findFirst({ where: { tenantId, phone } });
    return client as Client | null;
  }

  async list(tenantId: string, filters: ClientFilters, page: number, limit: number) {
    const where: Record<string, unknown> = { tenantId };
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.classification) where.classification = filters.classification;
    if (filters.isLead !== undefined) where.isLead = filters.isLead;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;

    const [data, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.client.count({ where }),
    ]);

    return { data: data as Client[], total };
  }

  async create(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'engagementScore' | 'classification' | 'firstPurchaseAt'>): Promise<Client> {
    const client = await prisma.client.create({ data });
    return client as Client;
  }

  async update(tenantId: string, id: string, data: Partial<Client>): Promise<Client> {
    const client = await prisma.client.update({ where: { id }, data });
    return client as Client;
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await prisma.client.delete({ where: { id } });
  }

  async count(tenantId: string): Promise<number> {
    return prisma.client.count({ where: { tenantId } });
  }

  async listLeads(tenantId: string, page: number, limit: number) {
    const where = { tenantId, isLead: true };
    const [data, total] = await Promise.all([
      prisma.client.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.client.count({ where }),
    ]);
    return { data: data as Client[], total };
  }

  async convertToClient(tenantId: string, id: string): Promise<Client> {
    const client = await prisma.client.update({ where: { id }, data: { isLead: false } });
    return client as Client;
  }

  async bulkEditNames(tenantId: string, edits: Array<{ id: string; name: string }>): Promise<number> {
    let count = 0;
    for (const edit of edits) {
      await prisma.client.update({ where: { id: edit.id }, data: { name: edit.name } });
      count++;
    }
    return count;
  }
}
