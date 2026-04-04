import { subscribe, EVENTS } from '@wbc/shared';
import type { ScheduledMessageRepository } from '../ports/messaging-repository';
import { PrismaScheduledMessageRepository } from '../adapters/prisma-messaging-repository';

const defaultRepo = new PrismaScheduledMessageRepository();

export async function handlePaymentOverdue(tenantId: string, clientId: string, amount: number, saleId: string, repo: ScheduledMessageRepository = defaultRepo): Promise<void> {
  const client = await repo.findClient(tenantId, clientId);
  if (!client) return;
  await repo.create(tenantId, {
    clientId,
    message: `Olá {{nome}}, lembramos que você tem um pagamento pendente de R$ ${amount.toFixed(2)}. Qualquer dúvida, estamos à disposição!`,
    sendAt: new Date(),
    type: 'BILLING_REMINDER',
  });
}

export async function handleClientCreated(tenantId: string, clientId: string, source: string, repo: ScheduledMessageRepository = defaultRepo): Promise<void> {
  if (source === 'IMPORT' || source === 'SPREADSHEET') return;
  await repo.create(tenantId, {
    clientId,
    message: 'Olá {{nome}}, seja bem-vinda! Estou aqui para te ajudar com os melhores produtos de beleza.',
    sendAt: new Date(),
    type: 'WELCOME',
  });
}

export async function handleCashbackExpiring(tenantId: string, clientId: string, amount: number, daysLeft: number, repo: ScheduledMessageRepository = defaultRepo): Promise<void> {
  await repo.create(tenantId, {
    clientId,
    message: `Olá {{nome}}, você tem R$ ${amount.toFixed(2)} de cashback que expira em ${daysLeft} dias! Use antes que expire.`,
    sendAt: new Date(),
    type: 'CASHBACK_EXPIRING',
  });
}

export function registerAutoMessageHandlers(): void {
  subscribe(EVENTS.PAYMENT_OVERDUE, async (event) => {
    const p = event.payload as { tenantId: string; clientId: string; amount: number; saleId: string };
    await handlePaymentOverdue(p.tenantId, p.clientId, p.amount, p.saleId);
  });

  subscribe(EVENTS.CLIENT_CREATED, async (event) => {
    const p = event.payload as { tenantId: string; clientId: string; source: string };
    await handleClientCreated(p.tenantId, p.clientId, p.source);
  });

  subscribe(EVENTS.CASHBACK_EXPIRING, async (event) => {
    const p = event.payload as { tenantId: string; clientId: string; amount: number; daysLeft: number };
    await handleCashbackExpiring(p.tenantId, p.clientId, p.amount, p.daysLeft);
  });
}
