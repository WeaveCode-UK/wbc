// Health server HTTP minimo para o worker (ACH-011).
// Usa node:http nativo (zero deps). Expoe:
//   GET /health/live   — processo vivo; sempre 200
//   GET /health/ready  — dependencias + lag do outbox
//   GET /health        — alias para /health/ready
// Nao monta nenhum outro endpoint — o worker nao serve API de negocio.

import {
  createServer,
  type IncomingMessage,
  type Server as HttpServer,
  type ServerResponse,
} from "node:http";
import type { Worker as BullMQWorker } from "bullmq";
import { prisma } from "@wbc/db";
import { logger } from "./lib/logger";

interface ServerHandles {
  server: HttpServer;
  stop: () => Promise<void>;
}

export interface WorkerHealthConfig {
  port: number;
  workers: BullMQWorker[];
  outboxLagThresholdMs: number;
}

export const DEFAULT_WORKER_HEALTH_PORT = 9100;
export const DEFAULT_OUTBOX_LAG_THRESHOLD_MS = 60_000;

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

/**
 * Reporta status basico dos workers BullMQ (running/paused). A profundidade
 * real de cada fila requer um Queue object separado (o Worker do BullMQ nao
 * expoe queue depth diretamente). Melhoria planejada: instanciar Queues em
 * paralelo aos Workers e passa-las aqui para reportar waiting/active/delayed.
 */
async function collectWorkerStatus(
  workers: BullMQWorker[],
): Promise<Record<string, { paused: boolean }>> {
  const status: Record<string, { paused: boolean }> = {};
  for (const w of workers) {
    try {
      status[w.name] = { paused: await w.isPaused() };
    } catch {
      status[w.name] = { paused: false };
    }
  }
  return status;
}

async function outboxLagMs(): Promise<number> {
  try {
    const oldest = await prisma.outboxEvent.findFirst({
      where: { processedAt: null },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });
    if (!oldest) return 0;
    return Date.now() - oldest.createdAt.getTime();
  } catch (error) {
    logger.warn({ error }, "Health: failed to compute outbox lag");
    return -1;
  }
}

/**
 * Inicia um HTTP server minimal para health checks do worker.
 * Retorna handles para permitir graceful shutdown (chamar stop()).
 */
export function startWorkerHealthServer(
  config: WorkerHealthConfig,
): ServerHandles {
  const server = createServer(
    async (req: IncomingMessage, res: ServerResponse) => {
      const url = req.url ?? "/";

      if (req.method !== "GET") {
        res.writeHead(405).end();
        return;
      }

      if (url === "/health/live") {
        sendJson(res, 200, {
          status: "ok",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (url === "/health/ready" || url === "/health") {
        const lagMs = await outboxLagMs();
        const workerStatus = await collectWorkerStatus(config.workers);
        const withinThreshold =
          lagMs >= 0 && lagMs <= config.outboxLagThresholdMs;
        const anyPaused = Object.values(workerStatus).some((w) => w.paused);
        const ready = withinThreshold && !anyPaused;
        sendJson(res, ready ? 200 : 503, {
          status: ready ? "ok" : "degraded",
          checks: {
            outboxLagMs: lagMs,
            outboxLagThresholdMs: config.outboxLagThresholdMs,
            outboxWithinThreshold: withinThreshold ? "ok" : "error",
            workers: workerStatus,
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.writeHead(404).end();
    },
  );

  server.listen(config.port, () => {
    logger.info({ port: config.port }, "Worker health server listening");
  });

  return {
    server,
    stop: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      }),
  };
}
