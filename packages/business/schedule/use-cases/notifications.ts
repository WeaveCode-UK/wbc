import { subscribe, EVENTS } from '@wbc/shared';
import type { NotificationRepository } from '../ports/schedule-repository';

export async function listNotifications(tenantId: string, page: number, limit: number, repo: NotificationRepository) {
  return repo.list(tenantId, page, limit);
}

export async function markAsRead(tenantId: string, id: string, repo: NotificationRepository) {
  return repo.markAsRead(tenantId, id);
}

export async function markAllAsRead(tenantId: string, repo: NotificationRepository) {
  return repo.markAllAsRead(tenantId);
}

export function registerNotificationEventHandlers(repo: NotificationRepository): void {
  subscribe(EVENTS.STOCK_LOW, async (event) => {
    const p = event.payload as { tenantId: string; productId: string; quantity: number };
    await repo.create(p.tenantId, 'Estoque baixo', `Produto com estoque baixo: ${p.quantity} unidades restantes`, 'STOCK_LOW');
  });

  subscribe(EVENTS.REMINDER_TRIGGERED, async (event) => {
    const p = event.payload as { tenantId: string; type: string };
    await repo.create(p.tenantId, 'Lembrete', `Você tem um lembrete: ${p.type}`, 'REMINDER');
  });

  subscribe(EVENTS.PAYMENT_OVERDUE, async (event) => {
    const p = event.payload as { tenantId: string; amount: number };
    await repo.create(p.tenantId, 'Pagamento em atraso', `Pagamento de R$ ${p.amount} está em atraso`, 'PAYMENT_OVERDUE');
  });

  subscribe(EVENTS.APPOINTMENT_UPCOMING, async (event) => {
    const p = event.payload as { tenantId: string; startsAt: string };
    await repo.create(p.tenantId, 'Agendamento próximo', `Você tem um agendamento: ${p.startsAt}`, 'APPOINTMENT');
  });
}
