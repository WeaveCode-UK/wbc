import { prisma } from '@wbc/db';
import { subscribe, EVENTS } from '@wbc/shared';

export async function listNotifications(tenantId: string, page: number = 1, limit: number = 20) {
  const where = { tenantId };
  const [data, total, unread] = await Promise.all([
    prisma.notification.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { tenantId, read: false } }),
  ]);
  return { data, total, unread };
}

export async function markAsRead(tenantId: string, id: string) {
  return prisma.notification.update({ where: { id }, data: { read: true } });
}

export async function markAllAsRead(tenantId: string) {
  await prisma.notification.updateMany({ where: { tenantId, read: false }, data: { read: true } });
  return { success: true };
}

async function createNotification(tenantId: string, title: string, body: string, type: string) {
  await prisma.notification.create({ data: { tenantId, title, body, type } });
}

export function registerNotificationEventHandlers(): void {
  subscribe(EVENTS.STOCK_LOW, async (event) => {
    const p = event.payload as { tenantId: string; productId: string; quantity: number };
    await createNotification(p.tenantId, 'Estoque baixo', `Produto com estoque baixo: ${p.quantity} unidades restantes`, 'STOCK_LOW');
  });

  subscribe(EVENTS.REMINDER_TRIGGERED, async (event) => {
    const p = event.payload as { tenantId: string; type: string };
    await createNotification(p.tenantId, 'Lembrete', `Você tem um lembrete: ${p.type}`, 'REMINDER');
  });

  subscribe(EVENTS.PAYMENT_OVERDUE, async (event) => {
    const p = event.payload as { tenantId: string; amount: number };
    await createNotification(p.tenantId, 'Pagamento em atraso', `Pagamento de R$ ${p.amount} está em atraso`, 'PAYMENT_OVERDUE');
  });

  subscribe(EVENTS.APPOINTMENT_UPCOMING, async (event) => {
    const p = event.payload as { tenantId: string; startsAt: string };
    await createNotification(p.tenantId, 'Agendamento próximo', `Você tem um agendamento: ${p.startsAt}`, 'APPOINTMENT');
  });
}
