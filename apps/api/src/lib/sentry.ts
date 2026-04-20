import * as Sentry from "@sentry/node";
import { redactSentryEvent } from "@wbc/shared";

export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    // Sentry disabled in dev if no DSN
    return;
  }

  const isProduction = process.env.NODE_ENV === "production";

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "development",
    tracesSampleRate: isProduction ? 0.3 : 0.1,
    sendDefaultPii: false,
    beforeSend: (event) => redactSentryEvent(event),
    beforeBreadcrumb: (breadcrumb) => redactSentryEvent(breadcrumb),
  });
}

export { Sentry };
