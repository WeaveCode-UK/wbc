import pino, { type Logger } from "pino";
import { getActiveTraceContext } from "./observability/trace-context";

/**
 * Central logger for use across packages and apps. Replaces direct
 * `console.log` / `console.error` calls so PII redaction (see
 * `redactSecurityFields`) and structured logging stay consistent.
 *
 * Apps that want a thinner wrapper (e.g. `apps/api/src/lib/logger.ts`) should
 * delegate to this factory rather than instantiate pino directly, so log
 * formatting stays uniform.
 */
// ACH-013 observabilidade-operacao: level configurável via env.
// Default em produção vira `warn` para reduzir volume — info/debug
// ficam opt-in quando o operador precisa investigar.
function getLogLevel(): string {
  const env = process.env.LOG_LEVEL;
  if (env) return env;
  return process.env.NODE_ENV === "production" ? "warn" : "debug";
}

// ACH-003 observabilidade-operacao: Pino redact no pipeline do logger.
// Os valores listados em REDACT_PATHS são substituídos por "[REDACTED]"
// antes da serialização. Complementa os helpers de redaction.ts
// (maskPhone, maskEmail) — aqueles continuam úteis quando o caller já
// sabe qual campo precisa mascarar; este cobre a rede de segurança
// quando um payload novo aparece e o caller esqueceu.
const REDACT_PATHS = [
  "*.email",
  "*.phone",
  "*.password",
  "*.passwordHash",
  "*.token",
  "*.accessToken",
  "*.refreshToken",
  "*.apiKey",
  "*.authorization",
  "email",
  "phone",
  "password",
  "passwordHash",
  "token",
  "authorization",
  "*.headers.authorization",
  "*.headers.cookie",
];

export function createLogger(service: string): Logger {
  return pino({
    name: `wbc-${service}`,
    level: getLogLevel(),
    redact: { paths: REDACT_PATHS, censor: "[REDACTED]" },
    // ACH-002 observabilidade-operacao: injeta traceId/spanId em cada
    // log se houver span OTel ativo. Pino mixin é chamado a cada log
    // call — cost mínimo, zero por linha quando não há span.
    mixin: () => {
      const ctx = getActiveTraceContext();
      if (!ctx) return {};
      return { traceId: ctx.traceId, spanId: ctx.spanId };
    },
    transport:
      process.env.NODE_ENV === "development"
        ? { target: "pino-pretty", options: { colorize: true } }
        : undefined,
  });
}
