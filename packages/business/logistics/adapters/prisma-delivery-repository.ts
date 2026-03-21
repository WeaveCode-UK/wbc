import { prisma } from '@wbc/db';
import type { DeliveryRepository } from '../ports/delivery-repository';
import type { DeliveryEntity, DeliveryStatus } from '../domain/entities';

export class PrismaDeliveryRepository implements DeliveryRepository {
  async findById(tenantId: string, deliveryId: string): Promise<DeliveryEntity | null> {
    const r = await prisma.delivery.findFirst({ where: { id: deliveryId } });
    return r as unknown as DeliveryEntity | null;
  }
  async findBySaleId(tenantId: string, saleId: string): Promise<DeliveryEntity | null> {
    const r = await prisma.delivery.findFirst({ where: { saleId } });
    return r as unknown as DeliveryEntity | null;
  }
  async findByStatus(tenantId: string, status: DeliveryStatus): Promise<DeliveryEntity[]> {
    const r = await prisma.delivery.findMany({ where: { status: status as 'CONFIRMED' | 'SEPARATED' | 'SHIPPED' | 'DELIVERED' }, orderBy: { createdAt: 'desc' } });
    return r as unknown as DeliveryEntity[];
  }
  async findPendingToday(tenantId: string): Promise<DeliveryEntity[]> {
    const r = await prisma.delivery.findMany({ where: { status: { in: ['CONFIRMED', 'SEPARATED'] } }, orderBy: { createdAt: 'asc' } });
    return r as unknown as DeliveryEntity[];
  }
  async list(tenantId: string, filters?: { status?: DeliveryStatus; clientId?: string }): Promise<DeliveryEntity[]> {
    const r = await prisma.delivery.findMany({
      where: { ...(filters?.status ? { status: filters.status as 'CONFIRMED' | 'SEPARATED' | 'SHIPPED' | 'DELIVERED' } : {}), ...(filters?.clientId ? { clientId: filters.clientId } : {}) },
      orderBy: { createdAt: 'desc' },
    });
    return r as unknown as DeliveryEntity[];
  }
  async create(data: Omit<DeliveryEntity, 'id' | 'deliveredAt' | 'createdAt' | 'updatedAt'>): Promise<DeliveryEntity> {
    const r = await prisma.delivery.create({ data: { saleId: data.saleId, clientId: data.clientId, method: data.method as 'PERSONAL' | 'MAIL' | 'COURIER' | 'PICKUP', status: 'CONFIRMED', address: data.address, trackingCode: data.trackingCode, estimatedDays: null } });
    return r as unknown as DeliveryEntity;
  }
  async updateStatus(tenantId: string, deliveryId: string, status: DeliveryStatus, extra?: { trackingCode?: string; deliveredAt?: Date }): Promise<DeliveryEntity> {
    const r = await prisma.delivery.update({ where: { id: deliveryId }, data: { status: status as 'CONFIRMED' | 'SEPARATED' | 'SHIPPED' | 'DELIVERED', ...extra } });
    return r as unknown as DeliveryEntity;
  }
  async delete(tenantId: string, deliveryId: string): Promise<void> {
    await prisma.delivery.delete({ where: { id: deliveryId } });
  }
}
