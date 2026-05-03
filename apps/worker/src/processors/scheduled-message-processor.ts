import { Worker, Queue, type Job } from "bullmq";
import { prisma } from "@wbc/db";
import { connection } from "../lib/redis";
import { logger } from "../lib/logger";
import { JOB_QUEUES } from "@wbc/shared";
import { messagingQueue } from "../queues";

// Bloco 1 do plano: cron que varre ScheduledMessage e PostSaleFlow,
// enfileira jobs em wbc:messaging e marca os registros como SENT.
//
// Resolve as features #10 (mensagens individuais agendadas), #12
// (pós-venda 2+2+2), #13 (cobrança automática), #86 (boas-vindas
// automática), #87 (reativação automática). Os handlers em
// auto-messages.ts e post-sale-flow.ts populam as duas tabelas
// corretamente; até hoje ninguém varria.
//
// Marcação otimista: status vira SENT no momento em que o job entra na
// messaging queue (não quando o WhatsApp confirma). Trade-off vs
// pessimismo (status QUEUED separado) escolhido para evitar uma
// migração nova: BullMQ tem retry próprio e o messaging-processor
// (Bloco 2) pode marcar como FAILED em falha terminal.

export const QUEUE_NAME = "wbc:scheduled-messages";

type ScheduledMessageJob = { kind: "scan" };

const scheduledQueue = new Queue<ScheduledMessageJob>(QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    removeOnComplete: 200,
    removeOnFail: 500,
    attempts: 3,
    backoff: { type: "exponential", delay: 30_000 },
  },
});

const SCAN_BATCH_SIZE = 100;
const SCAN_INTERVAL_MS = Number(
  process.env.SCHEDULED_MESSAGE_SCAN_INTERVAL_MS ?? 60_000,
);

interface MessagingJob {
  type: "SEND_TEXT" | "SEND_AUDIO" | "SEND_SCHEDULED";
  tenantId: string;
  clientId: string;
  message?: string;
  audioUrl?: string;
}

async function enqueueMessaging(
  name: string,
  payload: MessagingJob,
): Promise<void> {
  await messagingQueue.add(name, payload);
}

async function processScheduledMessages(now: Date): Promise<number> {
  // findMany + per-row updateMany check-and-set evita double-pickup
  // sem precisar de transação serializável.
  const rows = await prisma.scheduledMessage.findMany({
    where: { status: "PENDING", sendAt: { lte: now } },
    take: SCAN_BATCH_SIZE,
  });
  let dispatched = 0;
  for (const row of rows) {
    const claim = await prisma.scheduledMessage.updateMany({
      where: { id: row.id, status: "PENDING" },
      data: { status: "SENT" },
    });
    if (claim.count === 0) continue;
    await enqueueMessaging("send-scheduled", {
      type: row.audioUrl ? "SEND_AUDIO" : "SEND_TEXT",
      tenantId: row.tenantId,
      clientId: row.clientId,
      message: row.message,
      audioUrl: row.audioUrl ?? undefined,
    });
    dispatched++;
  }
  return dispatched;
}

async function processPostSaleFlows(now: Date): Promise<number> {
  // PostSaleFlow não guarda o tenantId — vem via Sale. E o texto vem do
  // template selecionado por (categoria, variant), com fallback se a
  // variant pedida não existir.
  const rows = await prisma.postSaleFlow.findMany({
    where: { status: "PENDING", scheduledAt: { lte: now } },
    take: SCAN_BATCH_SIZE,
    include: { sale: { select: { tenantId: true } } },
  });
  if (rows.length === 0) return 0;

  const stageToCategory = {
    TWO_DAYS: "POST_SALE_2D",
    TWO_WEEKS: "POST_SALE_2W",
    TWO_MONTHS: "POST_SALE_2M",
    RESTOCK: "RESTOCK",
  } as const;

  let dispatched = 0;
  for (const flow of rows) {
    const category = stageToCategory[flow.stage];
    const template = await prisma.messageTemplate.findFirst({
      where: {
        category,
        variant: flow.messageVariant,
        OR: [{ tenantId: flow.sale.tenantId }, { tenantId: null }],
      },
      orderBy: { tenantId: "desc" }, // tenant own template wins over system
    });
    const fallback = template
      ? null
      : await prisma.messageTemplate.findFirst({
          where: {
            category,
            OR: [{ tenantId: flow.sale.tenantId }, { tenantId: null }],
          },
          orderBy: { variant: "asc" },
        });
    const text = template?.text ?? fallback?.text;
    if (!text) {
      logger.warn(
        { flowId: flow.id, category, variant: flow.messageVariant },
        "Sem template POST_SALE — pulando flow",
      );
      continue;
    }

    const claim = await prisma.postSaleFlow.updateMany({
      where: { id: flow.id, status: "PENDING" },
      data: { status: "SENT", sentAt: new Date() },
    });
    if (claim.count === 0) continue;

    await enqueueMessaging("send-post-sale", {
      type: "SEND_TEXT",
      tenantId: flow.sale.tenantId,
      clientId: flow.clientId,
      message: text,
    });
    dispatched++;
  }
  return dispatched;
}

async function processScanJob(_job: Job<ScheduledMessageJob>): Promise<void> {
  const now = new Date();
  const [scheduled, postSale] = await Promise.all([
    processScheduledMessages(now),
    processPostSaleFlows(now),
  ]);
  if (scheduled + postSale > 0) {
    logger.info(
      { scheduled, postSale, queue: JOB_QUEUES.MESSAGING },
      "scheduled-message scan dispatched",
    );
  }
}

export async function registerScheduledMessageSchedule(): Promise<void> {
  // BullMQ repeatable: jobId garante idempotência ao reiniciar o worker.
  await scheduledQueue.add(
    "scheduled-message:scan",
    { kind: "scan" },
    {
      repeat: { every: SCAN_INTERVAL_MS },
      jobId: "scheduled-message:scan",
    },
  );
  logger.info(
    { intervalMs: SCAN_INTERVAL_MS },
    "scheduled-message scanner registered",
  );
}

export function startScheduledMessageWorker(): Worker<ScheduledMessageJob> {
  const worker = new Worker<ScheduledMessageJob>(QUEUE_NAME, processScanJob, {
    connection,
    concurrency: 1,
  });

  worker.on("failed", (job, err) => {
    logger.error(
      { jobId: job?.id, error: err.message },
      "scheduled-message scan failed",
    );
  });

  return worker;
}
