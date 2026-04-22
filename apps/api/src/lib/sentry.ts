import * as Sentry from "@sentry/node";
import { redactSentryEvent } from "@wbc/shared";

export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    // Sentry disabled in dev if no DSN
    return;
  }

  const isProduction = process.env.NODE_ENV === "production";

  // ACH-012 observabilidade-operacao: sample rate unificado via
  // SENTRY_TRACES_SAMPLE_RATE (mesma env em web/api/worker). Default
  // preserva o comportamento anterior (0.3 prod / 0.1 dev).
  const sampleRateEnv = Number.parseFloat(
    process.env.SENTRY_TRACES_SAMPLE_RATE ?? "",
  );
  const tracesSampleRate = Number.isFinite(sampleRateEnv)
    ? sampleRateEnv
    : isProduction
      ? 0.3
      : 0.1;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "development",
    tracesSampleRate,
    sendDefaultPii: false,
    beforeSend: (event) => redactSentryEvent(event),
    beforeBreadcrumb: (breadcrumb) => redactSentryEvent(breadcrumb),
  });
  Sentry.setTag("service", "api");
}

export { Sentry };
