import pino, { type Logger } from "pino";

/**
 * Central logger for use across packages and apps. Replaces direct
 * `console.log` / `console.error` calls so PII redaction (see
 * `redactSecurityFields`) and structured logging stay consistent.
 *
 * Apps that want a thinner wrapper (e.g. `apps/api/src/lib/logger.ts`) should
 * delegate to this factory rather than instantiate pino directly, so log
 * formatting stays uniform.
 */
export function createLogger(service: string): Logger {
  return pino({
    name: `wbc-${service}`,
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    transport:
      process.env.NODE_ENV === "development"
        ? { target: "pino-pretty", options: { colorize: true } }
        : undefined,
  });
}
