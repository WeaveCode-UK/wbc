import { initTracing } from "./lib/tracing";
import { createLogger } from "./lib/logger";
import { initSentry } from "./lib/sentry";
import { applyTenantMiddleware } from "@wbc/db";
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
