import { prisma } from '@wbc/db';
import type { DeliveryRepository } from '../ports/delivery-repository';
import type { DeliveryEntity, DeliveryStatus } from '../domain/entities';

export class PrismaDeliveryRepository implements DeliveryRepository {
  async findById(tenantId: string, deliveryId: string): Promise<DeliveryEntity | null> {
    return prisma.delivery.findFirst({ where: { id: deliveryId } }) as Promise<DeliveryEntity | null>;
  }
  async findBySaleId(tenantId: string, saleId: string): Promise<DeliveryEntity | null> {
    return prisma.delivery.findFirst({ where: { saleId } }) as Promise<DeliveryEntity | null>;
  }
  async findByStatus(tenantId: string, status: DeliveryStatus): Promise<DeliveryEntity[]> {
    return prisma.delivery.findMany({ where: { status: status as 'CONFIRMED' | 'SEPARATED' | 'SHIPPED' | 'DELIVERED' }, orderBy: { createdAt: 'desc' } }) as Promise<DeliveryEntity[]>;
  }
  async findPendingToday(tenantId: string): Promise<DeliveryEntity[]> {
    return prisma.delivery.findMany({ where: { status: { in: ['CONFIRMED', 'SEPARATED'] } }, orderBy: { createdAt: 'asc' } }) as Promise<DeliveryEntity[]>;
  }
  async list(tenantId: string, filters?: { status?: DeliveryStatus; clientId?: string }): Promise<DeliveryEntity[]> {
    return prisma.delivery.findMany({
      where: { ...(filters?.status ? { status: filters.status as 'CONFIRMED' | 'SEPARATED' | 'SHIPPED' | 'DELIVERED' } : {}), ...(filters?.clientId ? { clientId: filters.clientId } : {}) },
      orderBy: { createdAt: 'desc' },
    }) as Promise<DeliveryEntity[]>;
  }
  async create(data: Omit<DeliveryEntity, 'id' | 'deliveredAt' | 'createdAt' | 'updatedAt'>): Promise<DeliveryEntity> {
    return prisma.delivery.create({ data: { saleId: data.saleId, clientId: data.clientId, method: data.method as 'PERSONAL' | 'MAIL' | 'COURIER' | 'PICKUP', status: 'CONFIRMED', address: data.address, trackingCode: data.trackingCode, estimatedDays: null } }) as Promise<DeliveryEntity>;
  }
  async updateStatus(tenantId: string, deliveryId: string, status: DeliveryStatus, extra?: { trackingCode?: string; deliveredAt?: Date }): Promise<DeliveryEntity> {
    return prisma.delivery.update({ where: { id: deliveryId }, data: { status: status as 'CONFIRMED' | 'SEPARATED' | 'SHIPPED' | 'DELIVERED', ...extra } }) as Promise<DeliveryEntity>;
  }
  async delete(tenantId: string, deliveryId: string): Promise<void> {
    await prisma.delivery.delete({ where: { id: deliveryId } });
  }
}
