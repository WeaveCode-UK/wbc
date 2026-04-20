import { router, publicProcedure } from "../trpc/trpc";
import { getRedis } from "../lib/redis";
import { createLogger } from "../lib/logger";
import { prisma } from "@wbc/db";
import {
  API_VERSION,
  MIN_MOBILE_VERSION,
  SUPPORTED_MOBILE_VERSIONS,
  isOutboxReady,
} from "@wbc/shared";

const logger = createLogger("health");

// Threshold de lag do outbox aceitavel para readiness (ms). Configuravel via env.
const OUTBOX_READY_LAG_THRESHOLD_MS = Number(
  process.env.OUTBOX_READY_LAG_THRESHOLD_MS ?? 60_000,
);

/**
 * ACH-023: only callers from inside the cluster (or with a shared
 * `READY_DETAILS_TOKEN`) get the detailed readiness payload. Everyone else
 * gets a flat ok/degraded so external probes can map architecture details.
 *
 * Internal IPs are RFC1918 / RFC4193 / loopback. The header `x-internal-probe`
 * with the matching token also unlocks the detailed view (use it in
 * Kubernetes liveness/readiness annotations).
 */
const INTERNAL_IP_RE =
  /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|127\.|::1$|fc|fd)/i;

function isInternalCaller(
  ipAddress: string | undefined,
  headerToken: string | undefined,
): boolean {
  const expectedToken = process.env.READY_DETAILS_TOKEN;
  if (expectedToken && headerToken && headerToken === expectedToken)
    return true;
  if (!ipAddress) return false;
  return INTERNAL_IP_RE.test(ipAddress);
}

/**
 * Health checks separados em live vs ready (ACH-011), seguindo convenção Kubernetes:
 * - live: processo esta vivo? Retorna 200 sempre que o handler responder.
 * - ready: processo esta pronto para receber trafego? Checa dependencias criticas.
 *
 * Mantem procedures `redis` e `db` legadas para compat com clientes atuais.
 */
export const healthRouter = router({
  version: publicProcedure.query(() => ({
    apiVersion: API_VERSION,
    minMobileVersion: MIN_MOBILE_VERSION,
    // ACH-002 apis-integracoes: expose the full supported-mobile set so
    // a client can decide whether to refuse to start (too old), warn
    // and continue (supported-but-deprecated), or run clean (latest).
    supportedMobileVersions: SUPPORTED_MOBILE_VERSIONS,
    // ACH-010 apis-integracoes: publish the wire-format contract so SDK
    // consumers don't have to infer "ISO UTC" from the first response.
    // Tenant-local display timezone lives on the protected tenant
    // profile — `version` is public and knows nothing about a caller.
    wireFormat: {
      dates: "iso-8601",
      dateTimezone: "UTC",
      numbers: "json-number",
    } as const,
  })),

  // Liveness: se este handler respondeu, o processo esta vivo. Sem dependencias externas.
  live: publicProcedure.query(() => ({
    status: "ok" as const,
    timestamp: new Date().toISOString(),
  })),

  // Readiness: checa dependencias criticas — DB, Redis e lag do outbox.
  // Retorna 'ok' se tudo saudavel, 'degraded' se alguma dependencia falhar.
  // ACH-023: detalhes (lag, thresholds, contadores) só são expostos a callers
  // internos; público recebe apenas o overall status.
  ready: publicProcedure.query(async ({ ctx }) => {
    const checks = {
      database: "unknown" as "ok" | "error" | "unknown",
      redis: "unknown" as "ok" | "error" | "unknown",
      outboxLagMs: -1 as number,
      outboxWithinThreshold: "unknown" as "ok" | "error" | "unknown",
      // ACH-017 apis-integracoes: surface whether the event bus is wired.
      // `error` here means publish() would throw — a hard fault that
      // operators should page on.
      outboxPortConfigured: "unknown" as "ok" | "error" | "unknown",
    };

    checks.outboxPortConfigured = isOutboxReady() ? "ok" : "error";
    if (checks.outboxPortConfigured === "error") {
      logger.error(
        {},
        "Readiness check: outbox port not configured (setOutboxPort never called)",
      );
    }

    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = "ok";
    } catch (error) {
      logger.error({ error }, "Readiness DB check failed");
      checks.database = "error";
    }

    try {
      const redis = getRedis();
      await redis.ping();
      checks.redis = "ok";
    } catch (error) {
      logger.error({ error }, "Readiness Redis check failed");
      checks.redis = "error";
    }

    // Lag do outbox = idade do evento mais antigo nao-processado. Se estiver velho
    // alem do threshold, o worker nao esta acompanhando e o sistema nao esta pronto.
    try {
      const oldest = await prisma.outboxEvent.findFirst({
        where: { processedAt: null },
        orderBy: { createdAt: "asc" },
        select: { createdAt: true },
      });
      if (oldest) {
        checks.outboxLagMs = Date.now() - oldest.createdAt.getTime();
        checks.outboxWithinThreshold =
          checks.outboxLagMs <= OUTBOX_READY_LAG_THRESHOLD_MS ? "ok" : "error";
      } else {
        checks.outboxLagMs = 0;
        checks.outboxWithinThreshold = "ok";
      }
    } catch (error) {
      logger.error({ error }, "Readiness outbox lag check failed");
      checks.outboxWithinThreshold = "error";
    }

    const overall =
      checks.database === "ok" &&
      checks.redis === "ok" &&
      checks.outboxWithinThreshold === "ok" &&
      checks.outboxPortConfigured === "ok"
        ? ("ok" as const)
        : ("degraded" as const);

    // Header lookup uses Headers if the transport delivered one; falls back
    // to env-style lookups when it didn't (e.g. tests).
    const headerToken =
      typeof globalThis.Headers !== "undefined" &&
      (ctx as { headers?: Headers }).headers
        ? ((ctx as { headers?: Headers }).headers!.get("x-internal-probe") ??
          undefined)
        : undefined;

    if (isInternalCaller(ctx.ipAddress, headerToken)) {
      return { status: overall, checks };
    }
    return { status: overall };
  }),

  redis: publicProcedure.query(async () => {
    try {
      const redis = getRedis();
      const pong = await redis.ping();
      return { status: "ok", response: pong };
    } catch (error) {
      logger.error({ error }, "Redis health check failed");
      return { status: "error" };
    }
  }),

  db: publicProcedure.query(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: "ok" };
    } catch (error) {
      logger.error({ error }, "Database health check failed");
      return { status: "error" };
    }
  }),
});
