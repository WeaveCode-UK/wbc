import { Worker, Job } from "bullmq";
import { JOB_QUEUES, logIfInvalidJobData } from "@wbc/shared";
import { prisma } from "@wbc/db";
import { connection } from "../lib/redis";
import { logger } from "../lib/logger";
import { WhatsAppN2Adapter } from "@wbc/business/messaging/adapters/whatsapp-n2-adapter";
import { generateDeepLink } from "@wbc/business/messaging/domain/whatsapp";
import { createPushableNotification } from "@wbc/business/schedule/use-cases/notification-fanout";
import { selectWhatsAppChannel } from "../lib/select-whatsapp-channel";

export interface MessagingJob {
  type: "SEND_TEXT" | "SEND_AUDIO" | "SEND_SCHEDULED";
  tenantId: string;
  clientId: string;
  message?: string;
  audioUrl?: string;
}

const whatsappN2 = new WhatsAppN2Adapter();

async function loadClient(
  tenantId: string,
  clientId: string,
): Promise<{ name: string; phone: string } | null> {
  return prisma.client.findFirst({
    where: { id: clientId, tenantId },
    select: { name: true, phone: true },
  });
}

// Bloco 2 do plano: o messaging-processor antes era um stub (apenas logava
// "to be implemented"). Agora consome o job, escolhe o canal via
// selectWhatsAppChannel e dispara N2 (Meta Cloud) ou N1 (Notification
// + deep link). Se N2 falhar, faz fallback pra N1 — comportamento que
// já existia em sale-confirmation-handler.ts.
async function processMessagingJob(job: Job<MessagingJob>): Promise<void> {
  logIfInvalidJobData(JOB_QUEUES.MESSAGING, job.name, job.data);
  const { tenantId, clientId, message, audioUrl, type } = job.data;
  if (!message && !audioUrl) {
    logger.warn({ jobId: job.id }, "messaging job sem message nem audioUrl");
    return;
  }
  const client = await loadClient(tenantId, clientId);
  if (!client) {
    logger.warn(
      { jobId: job.id, tenantId, clientId },
      "client não encontrado — job descartado",
    );
    return;
  }

  const channel = await selectWhatsAppChannel(tenantId);
  const idempotencyKey = `msg:${job.id ?? `${tenantId}:${clientId}:${Date.now()}`}`;

  if (channel === "N2") {
    try {
      if (audioUrl) {
        await whatsappN2.sendAudio(client.phone, audioUrl, { idempotencyKey });
      } else {
        await whatsappN2.sendText(client.phone, message ?? "", {
          idempotencyKey,
        });
      }
      logger.info(
        { jobId: job.id, tenantId, channel: "n2", type },
        "messaging dispatched via WhatsApp N2",
      );
      return;
    } catch (error) {
      logger.error(
        { jobId: job.id, error: (error as Error).message },
        "WhatsApp N2 falhou — fallback pra N1 notification",
      );
      // intentional fall-through to N1 below
    }
  }

  // N1: cria Notification pra consultora abrir o deep link e enviar manualmente.
  const text = message ?? audioUrl ?? "";
  const url = generateDeepLink(client.phone, text);
  await createPushableNotification({
    tenantId,
    type: `MSG_${type}_${clientId}_${Date.now()}`,
    title: `Mande mensagem pra ${client.name}`,
    body: url,
  });
  logger.info(
    { jobId: job.id, tenantId, channel: "n1", type },
    "messaging dispatched as N1 notification",
  );
}

export function startMessagingWorker(): Worker<MessagingJob> {
  const worker = new Worker("wbc:messaging", processMessagingJob, {
    connection,
    concurrency: 5,
    // ACH-010 performance-escalabilidade: outbound rate limit pra Meta WhatsApp
    // (tier business é ~10 msg/s antes de 429).
    limiter: {
      max: Number(process.env.MESSAGING_RATE_MAX ?? 10),
      duration: Number(process.env.MESSAGING_RATE_DURATION_MS ?? 1000),
    },
  });

  worker.on("completed", (job) => {
    logger.info({ jobId: job.id }, "Messaging job completed");
  });

  worker.on("failed", (job, err) => {
    logger.error(
      { jobId: job?.id, error: err.message },
      "Messaging job failed",
    );
  });

  return worker;
}
