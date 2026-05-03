// Next.js instrumentation hook. Runs once per worker process before any
// route handler — the only place where `Sentry.init` for the server and
// edge runtimes can be guaranteed to register before the first request.
//
// Without this file Next.js logs:
//   "[@sentry/nextjs] Could not find a Next.js instrumentation file"
// and server-side errors never reach Sentry. The previous setup left
// `sentry.server.config.ts` / `sentry.edge.config.ts` on disk but
// unloaded, which is why the 503 cascade observed during QA had no
// stack trace to correlate against.
//
// `register` is a Next.js convention; `process.env.NEXT_RUNTIME` is set
// by Next per-runtime so each side imports only what it can use
// (Node-only deps like async_hooks would explode in the edge runtime).

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// `onRequestError` is the Next.js 15 hook that forwards uncaught
// errors from server components, route handlers, and middleware to
// observability tooling. Sentry wraps this for us — see
// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
export { captureRequestError as onRequestError } from "@sentry/nextjs";
