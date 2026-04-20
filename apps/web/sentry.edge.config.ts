import * as Sentry from "@sentry/nextjs";
import { redactSentryEvent } from "@wbc/shared";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV ?? "development",
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0.1,
  sendDefaultPii: false,
  beforeSend: (event) => redactSentryEvent(event),
  beforeBreadcrumb: (breadcrumb) => redactSentryEvent(breadcrumb),
});
