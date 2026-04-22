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

// ACH-028 performance-escalabilidade: lag EMA buffer.
// Readiness used to flip degraded on a single GC-pause spike, which
// cascaded into container restarts. We now keep a small ring buffer
// of recent lag samples and report both the instantaneous value and
// the rolling mean; readiness decides on the mean, which smooths
// out single-sample spikes without hiding sustained lag.
const LAG_WINDOW_SIZE = 6; // 6 samples × scrape interval ≈ 30-60s window
const lagWindow: number[] = [];

function recordLag(sample: number): { instant: number; mean: number } {
  if (sample >= 0) {
    lagWindow.push(sample);
    if (lagWindow.length > LAG_WINDOW_SIZE) lagWindow.shift();
  }
  const mean =
    lagWindow.length === 0
      ? sample
      : lagWindow.reduce((a, b) => a + b, 0) / lagWindow.length;
  return { instant: sample, mean };
}

/**
 * ACH-029 performance-escalabilidade: queue depth per worker.
 * Previously we reported just `paused`. Autoscalers and alert rules
 * need `waiting` / `active` / `delayed` to react to backpressure
 * before the queue saturates. BullMQ's Worker owns an internal queue
 * reference via `opts.connection`; we probe it via a lightweight
 * `Queue.getJobCounts()` call that reuses the same Redis connection.
 */
async function collectWorkerStatus(workers: BullMQWorker[]): Promise<
  Record<
    string,
    {
      paused: boolean;
      waiting?: number;
      active?: number;
      delayed?: number;
      failed?: number;
    }
  >
> {
  const status: Record<
    string,
    {
      paused: boolean;
      waiting?: number;
      active?: number;
      delayed?: number;
      failed?: number;
    }
  > = {};
  for (const w of workers) {
    const paused = await w.isPaused().catch(() => false);
    try {
      // Lazy-import to avoid a top-level require cycle; Queue shares
      // the connection config with the Worker, so opening one per
      // probe is cheap and avoids holding a long-lived Queue ref.
      const { Queue } = await import("bullmq");
      const q = new Queue(w.name, { connection: w.opts.connection });
      const counts = (await q.getJobCounts(
        "waiting",
        "active",
        "delayed",
        "failed",
      )) as {
        waiting: number;
        active: number;
        delayed: number;
        failed: number;
      };
      await q.close();
      status[w.name] = { paused, ...counts };
    } catch {
      status[w.name] = { paused };
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
        const lagStats = recordLag(lagMs);
        const workerStatus = await collectWorkerStatus(config.workers);
        // ACH-028: readiness decides on the rolling mean, not the
        // instantaneous value — a single GC-pause spike no longer
        // trips the container into restart-cascade territory.
        const withinThreshold =
          lagStats.mean >= 0 && lagStats.mean <= config.outboxLagThresholdMs;
        const anyPaused = Object.values(workerStatus).some((w) => w.paused);
        const ready = withinThreshold && !anyPaused;
        sendJson(res, ready ? 200 : 503, {
          status: ready ? "ok" : "degraded",
          checks: {
            outboxLagMs: lagStats.instant,
            outboxLagMeanMs: Math.round(lagStats.mean),
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
