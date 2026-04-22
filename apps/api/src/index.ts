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

logger.info("WBC API starting...");
logger.info("Sentry initialized");
logger.info("Tenant middleware applied");
logger.info("Outbox port wired (via composition-root)");
logger.info("WBC API module loaded successfully");
