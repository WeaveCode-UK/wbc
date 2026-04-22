import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { primeTraceContext } from "@wbc/shared";
import { createLogger } from "./logger";

const logger = createLogger("tracing");
let sdk: NodeSDK | null = null;

/**
 * ACH-003 performance-escalabilidade: the old behaviour returned
 * silently when `OTEL_EXPORTER_OTLP_ENDPOINT` wasn't set. In
 * production that meant zero traces exported — and nobody noticed
 * until an incident made someone check. The new rule:
 *
 *   - prod: env var missing → throw (crash-loop is louder than silent
 *     lack of observability). Operator sets the var or picks a dev
 *     alternative that tolerates absence.
 *   - dev/test: env var missing → structured warn log
 *     (`tracing_enabled: false`) and skip SDK boot.
 */
export function initTracing(): void {
  const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!otlpEndpoint) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "OTEL_EXPORTER_OTLP_ENDPOINT is required in production. Set it or wire a different tracer; see docs/architecture/observability.md.",
      );
    }
    logger.warn(
      { tracing_enabled: false, reason: "OTEL_EXPORTER_OTLP_ENDPOINT not set" },
      "Tracing disabled",
    );
    return;
  }

  sdk = new NodeSDK({
    serviceName: "wbc-api",
    traceExporter: new OTLPTraceExporter({ url: `${otlpEndpoint}/v1/traces` }),
    instrumentations: [
      getNodeAutoInstrumentations({
        "@opentelemetry/instrumentation-fs": { enabled: false },
      }),
    ],
  });

  sdk.start();
  // ACH-002 observabilidade-operacao: carrega o módulo OTel no shared
  // logger para que traceId/spanId apareçam em cada log subsequente.
  void primeTraceContext();
  logger.info(
    { tracing_enabled: true, endpoint: otlpEndpoint },
    "Tracing enabled",
  );
}

export function shutdownTracing(): Promise<void> {
  return sdk?.shutdown() ?? Promise.resolve();
}
