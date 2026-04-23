import * as Sentry from "@sentry/nextjs";
// Import from the specific path rather than the barrel so client-side
// webpack doesn't follow tenant-context → async_hooks (Node-only).
import { redactSentryEvent } from "@wbc/shared/sentry-redaction";
import { filterCostNoise } from "@wbc/shared/sentry-noise-filter";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV ?? "development",
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0.1,
  replaysSessionSampleRate: 0,
  // ACH-005 custos-finops: 0.3 em prod reduz consumo de quota sem perder
  // cobertura útil (antes era 1.0 — 100% dos erros capturavam replay).
  replaysOnErrorSampleRate: process.env.NODE_ENV === "production" ? 0.3 : 0,
  sendDefaultPii: false,
  beforeSend: (event) => {
    const filtered = filterCostNoise(event);
    return filtered === null ? null : redactSentryEvent(filtered);
  },
  beforeBreadcrumb: (breadcrumb) => redactSentryEvent(breadcrumb),
});
