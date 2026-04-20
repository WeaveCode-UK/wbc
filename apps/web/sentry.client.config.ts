import * as Sentry from "@sentry/nextjs";
// Import from the specific path rather than the barrel so client-side
// webpack doesn't follow tenant-context → async_hooks (Node-only).
import { redactSentryEvent } from "@wbc/shared/sentry-redaction";

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
