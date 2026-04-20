import * as Sentry from "@sentry/nextjs";
import { redactSentryEvent } from "@wbc/shared";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV ?? "development",
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: process.env.NODE_ENV === "production" ? 1.0 : 0,
  sendDefaultPii: false,
  beforeSend: (event) => redactSentryEvent(event),
  beforeBreadcrumb: (breadcrumb) => redactSentryEvent(breadcrumb),
});
