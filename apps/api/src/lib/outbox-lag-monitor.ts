// ACH-007 confiabilidade-resiliencia: monitor de lag do outbox compartilhado
// entre o middleware de backpressure e qualquer outro consumidor no API.
//
// Desenho: em vez de cada request bater no Postgres calculando lag, um
// poller de background consulta a cada N ms e cacheia em memória.
// Custo por request: leitura de uma variável. Cold-start default: 0.

import { prisma } from "@wbc/db";

let cachedLagMs = 0;
let lastSampledAt = 0;
let timer: ReturnType<typeof setInterval> | null = null;

const POLL_INTERVAL_MS = Number.parseInt(
  process.env.OUTBOX_LAG_POLL_INTERVAL_MS ?? "5000",
  10,
);

async function sampleLag(): Promise<void> {
  try {
    const oldest = await prisma.outboxEvent.findFirst({
      where: { processedAt: null },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });
    cachedLagMs = oldest ? Date.now() - oldest.createdAt.getTime() : 0;
    lastSampledAt = Date.now();
  } catch {
    // Não quebra o request — lag desconhecido vira "sem backpressure".
  }
}

export function startOutboxLagMonitor(): void {
  if (timer) return;
  void sampleLag();
  timer = setInterval(() => void sampleLag(), POLL_INTERVAL_MS);
  if (typeof timer.unref === "function") timer.unref();
}

export function stopOutboxLagMonitor(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

export function getOutboxLagMs(): number {
  return cachedLagMs;
}

export function getOutboxLagAgeMs(): number {
  return lastSampledAt === 0
    ? Number.POSITIVE_INFINITY
    : Date.now() - lastSampledAt;
}
