import { prisma } from '@wbc/db';
import { subscribe, EVENTS } from '@wbc/shared';

const POST_SALE_STAGES = [
  { stage: 'TWO_DAYS', daysAfter: 2 },
  { stage: 'TWO_WEEKS', daysAfter: 14 },
  { stage: 'TWO_MONTHS', daysAfter: 60 },
] as const;

export async function createPostSaleFlows(
  tenantId: string,
  saleId: string,
  clientId: string,
): Promise<void> {
  // Delete any existing pending flows for this client (reset on new sale)
  await prisma.postSaleFlow.deleteMany({
    where: { clientId, status: 'PENDING' },
  });

  const now = new Date();
  const flows = POST_SALE_STAGES.map((stage) => {
    const scheduledAt = new Date(now);
    scheduledAt.setDate(scheduledAt.getDate() + stage.daysAfter);
    const variant = Math.floor(Math.random() * 5) + 1;

    return {
      saleId,
      clientId,
      stage: stage.stage as 'TWO_DAYS' | 'TWO_WEEKS' | 'TWO_MONTHS',
      messageVariant: variant,
      scheduledAt,
      status: 'PENDING' as const,
    };
  });

  await prisma.postSaleFlow.createMany({ data: flows });
}

export function registerPostSaleEventHandler(): void {
  subscribe(EVENTS.SALE_CONFIRMED, async (event) => {
    const payload = event.payload as { tenantId: string; saleId: string; clientId: string };
    await createPostSaleFlows(payload.tenantId, payload.saleId, payload.clientId);
  });
}

export async function processPendingPostSaleFlows(): Promise<number> {
  const now = new Date();
  const pendingFlows = await prisma.postSaleFlow.findMany({
    where: { status: 'PENDING', scheduledAt: { lte: now } },
    take: 50,
  });

  let processed = 0;
  for (const flow of pendingFlows) {
    await prisma.postSaleFlow.update({
      where: { id: flow.id },
      data: { status: 'SENT', sentAt: now },
    });
    processed++;
  }
  return processed;
}
