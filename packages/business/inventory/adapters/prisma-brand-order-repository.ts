import { prisma } from '@wbc/db';
import type { BrandOrderRepository } from '../ports/brand-order-repository';
import type { BrandOrder, BrandOrderItem } from '../domain/entities';

export class PrismaBrandOrderRepository implements BrandOrderRepository {
  async findById(tenantId: string, id: string): Promise<(BrandOrder & { items: BrandOrderItem[] }) | null> {
    const order = await prisma.brandOrder.findFirst({ where: { id, tenantId }, include: { items: true } });
    if (!order) return null;
    return { ...order, items: order.items.map((i) => ({ ...i, unitCost: Number(i.unitCost) })) } as BrandOrder & { items: BrandOrderItem[] };
  }

  async list(tenantId: string, status?: string): Promise<BrandOrder[]> {
    const where: Record<string, unknown> = { tenantId };
    if (status) where.status = status;
    const orders = await prisma.brandOrder.findMany({ where, orderBy: { orderedAt: 'desc' } });
    return orders as BrandOrder[];
  }

  async create(data: { tenantId: string; brandId: string; items: Array<{ productName: string; quantity: number; unitCost: number }>; notes?: string }): Promise<BrandOrder> {
    const order = await prisma.brandOrder.create({
      data: {
        tenantId: data.tenantId,
        brandId: data.brandId,
        notes: data.notes,
        items: { create: data.items },
      },
    });
    return order as BrandOrder;
  }

  async updateStatus(tenantId: string, id: string, status: string, receivedAt?: Date): Promise<BrandOrder> {
    const order = await prisma.brandOrder.update({
      where: { id },
      data: { status: status as 'ORDERED' | 'PARTIAL' | 'RECEIVED' | 'CANCELLED', receivedAt },
    });
    return order as BrandOrder;
  }
}
