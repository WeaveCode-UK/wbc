import { initTracing } from "./lib/tracing";
import { createLogger } from "./lib/logger";
import { initSentry } from "./lib/sentry";
import {
  applyTenantMiddleware,
  createSlowQueryMiddleware,
  prisma,
} from "@wbc/db";
import { getCurrentTenant, validateEnv } from "@wbc/shared";
import { getRepositories } from "./composition-root";
import { startOutboxLagMonitor } from "./lib/outbox-lag-monitor";
import { startApiMetricsServer } from "./metrics-server";

// Initialize tracing before anything else
initTracing();

// Validate environment variables
validateEnv("api");

// Initialize Sentry
initSentry();

const logger = createLogger("api");

// Apply tenant middleware
applyTenantMiddleware(() => getCurrentTenant()?.tenantId);

// ACH-030 performance-escalabilidade: log slow Prisma queries in prod.
// Sampling kept at 100% by default because the threshold (500 ms) already
// filters out normal traffic; dial down via env if noise spikes.
prisma.$use(
  createSlowQueryMiddleware({
    thresholdMs: Number(process.env.PRISMA_SLOW_QUERY_MS ?? 500),
    sampleRate: Number(process.env.PRISMA_SLOW_QUERY_SAMPLE ?? 1),
    warn: (fields, msg) => logger.warn(fields, msg),
  }),
);

// ACH-017 apis-integracoes: trigger composition-root at startup so the
// outbox port is wired and asserted before the first request. Previously
// the wire only happened when a router imported `getRepositories()`; a
// refactor that deferred that import would have left the event bus
// silently unwired until the first mutation.
getRepositories();

// ACH-007 confiabilidade-resiliencia: polling leve em background para
// alimentar o middleware de backpressure do outbox (`applyOutboxBackpressure`).
startOutboxLagMonitor();

// ACH-001 observabilidade-operacao (revisor): sobe o servidor HTTP de
// métricas na porta casada com o job `wbc-api` do Prometheus. Sem isso,
// o `metricsRegistry` populado pelos middlewares tRPC ficaria inacessível
// e o scrape do Prometheus sempre falharia.
startApiMetricsServer();

logger.info("WBC API starting...");
logger.info("Sentry initialized");
logger.info("Tenant middleware applied");
logger.info("Outbox port wired (via composition-root)");
logger.info("WBC API module loaded successfully");
