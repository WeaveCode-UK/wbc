import { prisma } from '@wbc/db';
import { publish, EVENTS } from '@wbc/shared';

export async function listDeliveries(tenantId: string, status?: string, date?: Date) {
  const where: Record<string, unknown> = { sale: { tenantId } };
  if (status) where.status = status;
  return prisma.delivery.findMany({ where, orderBy: { createdAt: 'desc' } });
}

export async function createDelivery(tenantId: string, saleId: string, clientId: string, method: string, address?: string, estimatedDays?: number) {
  return prisma.delivery.create({
    data: { saleId, clientId, method: method as 'PERSONAL' | 'MAIL' | 'COURIER' | 'PICKUP', address, estimatedDays },
  });
}

export async function updateDeliveryStatus(tenantId: string, id: string, status: string, trackingCode?: string) {
  const delivery = await prisma.delivery.update({
    where: { id },
    data: {
      status: status as 'CONFIRMED' | 'SEPARATED' | 'SHIPPED' | 'DELIVERED',
      trackingCode,
      shippedAt: status === 'SHIPPED' ? new Date() : undefined,
      deliveredAt: status === 'DELIVERED' ? new Date() : undefined,
    },
  });

  if (status === 'SHIPPED') {
    await publish(EVENTS.DELIVERY_SHIPPED, tenantId, { tenantId, saleId: delivery.saleId, trackingCode });
  }
  if (status === 'DELIVERED') {
    await publish(EVENTS.DELIVERY_DELIVERED, tenantId, { tenantId, saleId: delivery.saleId });
  }

  return delivery;
}

export async function getDayRoute(tenantId: string, date?: Date) {
  const targetDate = date ?? new Date();
  return prisma.delivery.findMany({
    where: { status: { in: ['CONFIRMED', 'SEPARATED'] }, sale: { tenantId } },
    orderBy: { address: 'asc' },
    include: { client: { select: { name: true, phone: true } } },
  });
}

export async function generateLabel(deliveryId: string) {
  const delivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
    include: { client: { select: { name: true, phone: true } }, sale: { include: { items: { include: { product: { select: { name: true } } } } } } },
  });
  if (!delivery) return null;
  return {
    clientName: delivery.client.name,
    clientPhone: delivery.client.phone,
    address: delivery.address,
    items: delivery.sale.items.map((i) => ({ name: i.product.name, quantity: i.quantity })),
  };
}
