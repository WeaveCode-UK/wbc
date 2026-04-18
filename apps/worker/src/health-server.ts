// Health server HTTP minimo para o worker (ACH-011).
// Usa node:http nativo (zero deps). Expoe:
//   GET /health/live   — processo vivo; sempre 200
//   GET /health/ready  — dependencias + lag do outbox
//   GET /health        — alias para /health/ready
// Nao monta nenhum outro endpoint — o worker nao serve API de negocio.

import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import type { Server, Worker as BullMQWorker } from "bullmq";
import { prisma } from "@wbc/db";
import { logger } from "./lib/logger";

interface ServerHandles {
  server: Server;
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

async function collectQueueDepths(
  workers: BullMQWorker[],
): Promise<Record<string, number>> {
  const depths: Record<string, number> = {};
  for (const w of workers) {
    try {
      const counts = await w.getMetrics("completed");
      // Metrics retornam contagem de completados; melhor seria depth via Queue,
      // mas Worker so tem getJobCounts implicitamente. Usamos o count como
      // aproximacao e expomos o nome da fila para monitoramento separado.
      depths[w.name] = counts?.count ?? -1;
    } catch {
      depths[w.name] = -1;
    }
  }
  return depths;
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
        const depths = await collectQueueDepths(config.workers);
        const withinThreshold =
          lagMs >= 0 && lagMs <= config.outboxLagThresholdMs;
        const ready = withinThreshold;
        sendJson(res, ready ? 200 : 503, {
          status: ready ? "ok" : "degraded",
          checks: {
            outboxLagMs: lagMs,
            outboxLagThresholdMs: config.outboxLagThresholdMs,
            outboxWithinThreshold: withinThreshold ? "ok" : "error",
            queueDepths: depths,
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
