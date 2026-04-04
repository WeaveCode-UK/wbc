import { subscribe, EVENTS } from '@wbc/shared';
import type { PostSaleFlowRepository } from '../ports/messaging-repository';
import { PrismaPostSaleFlowRepository } from '../adapters/prisma-messaging-repository';

const defaultRepo = new PrismaPostSaleFlowRepository();

const POST_SALE_STAGES = [
  { stage: 'TWO_DAYS', daysAfter: 2 },
  { stage: 'TWO_WEEKS', daysAfter: 14 },
  { stage: 'TWO_MONTHS', daysAfter: 60 },
] as const;

export async function createPostSaleFlows(
  tenantId: string,
  saleId: string,
  clientId: string,
  repo: PostSaleFlowRepository = defaultRepo,
): Promise<void> {
  await repo.deletePendingByClient(clientId);

  const now = new Date();
  const flows = POST_SALE_STAGES.map((stage) => {
    const scheduledAt = new Date(now);
    scheduledAt.setDate(scheduledAt.getDate() + stage.daysAfter);
    const variant = Math.floor(Math.random() * 5) + 1;

    return {
      saleId,
      clientId,
      stage: stage.stage as string,
      messageVariant: variant,
      scheduledAt,
      status: 'PENDING',
    };
  });

  await repo.createMany(flows);
}

export function registerPostSaleEventHandler(): void {
  subscribe(EVENTS.SALE_CONFIRMED, async (event) => {
    const payload = event.payload as { tenantId: string; saleId: string; clientId: string };
    await createPostSaleFlows(payload.tenantId, payload.saleId, payload.clientId);
  });
}

export async function processPendingPostSaleFlows(repo: PostSaleFlowRepository = defaultRepo): Promise<number> {
  const pendingFlows = await repo.findPending(50);
  let processed = 0;
  for (const flow of pendingFlows) {
    await repo.markSent(flow.id);
    processed++;
  }
  return processed;
}
