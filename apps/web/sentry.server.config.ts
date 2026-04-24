import * as Sentry from "@sentry/nextjs";
import { redactSentryEvent, filterCostNoise } from "@wbc/shared";

// ACH-005 custos-finops: sample rate unificado via SENTRY_TRACES_SAMPLE_RATE
// (mesma env em api/worker/web); default preserva 0.1 prod / 0.1 dev para
// reduzir consumo em Sentry.io vs o antigo 0.3.
const sampleRateEnv = Number.parseFloat(
  process.env.SENTRY_TRACES_SAMPLE_RATE ?? "",
);
const tracesSampleRate = Number.isFinite(sampleRateEnv)
  ? sampleRateEnv
  : process.env.NODE_ENV === "production"
    ? 0.1
    : 0.1;

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV ?? "development",
  tracesSampleRate,
  sendDefaultPii: false,
  beforeSend: (event) => {
    const filtered = filterCostNoise(event);
    return filtered === null ? null : redactSentryEvent(filtered);
  },
  beforeBreadcrumb: (breadcrumb) => redactSentryEvent(breadcrumb),
});
