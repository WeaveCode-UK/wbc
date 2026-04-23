import * as Sentry from "@sentry/node";
import { redactSentryEvent, filterCostNoise } from "@wbc/shared";

export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    // Sentry disabled in dev if no DSN
    return;
  }

  const isProduction = process.env.NODE_ENV === "production";

  // ACH-012 observabilidade-operacao + ACH-005 custos-finops: sample rate
  // unificado via SENTRY_TRACES_SAMPLE_RATE (mesma env em web/api/worker).
  // Default reduzido para 0.1 prod (antes 0.3) para economizar quota.
  const sampleRateEnv = Number.parseFloat(
    process.env.SENTRY_TRACES_SAMPLE_RATE ?? "",
  );
  const tracesSampleRate = Number.isFinite(sampleRateEnv)
    ? sampleRateEnv
    : isProduction
      ? 0.1
      : 0.1;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "development",
    tracesSampleRate,
    sendDefaultPii: false,
    // ACH-005 custos-finops: descarta 404s/timeouts/aborts antes da redação
    // para evitar consumo de quota com eventos sem valor diagnóstico.
    beforeSend: (event) => {
      const filtered = filterCostNoise(event);
      return filtered === null ? null : redactSentryEvent(filtered);
    },
    beforeBreadcrumb: (breadcrumb) => redactSentryEvent(breadcrumb),
  });
  Sentry.setTag("service", "api");
}

export { Sentry };
