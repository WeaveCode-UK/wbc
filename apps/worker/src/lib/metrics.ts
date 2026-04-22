// ACH-001 observabilidade-operacao: métricas do worker expostas em
// /metrics pelo health-server. Prometheus passa a coletar o worker
// diretamente (ver deploy/prometheus.yml).

import { Registry, Counter, Gauge, collectDefaultMetrics } from "prom-client";

export const workerMetricsRegistry = new Registry();

collectDefaultMetrics({ register: workerMetricsRegistry });

// ACH-005 observabilidade-operacao: métricas de infraestrutura que o
// worker pode observar sem dependência externa adicional. BullMQ queue
// depth é coletado periodicamente; outbox lag ms atualizado no health
// check.

export const outboxLagMsGauge = new Gauge({
  name: "wbc_outbox_lag_ms",
  help: "Age of the oldest unprocessed outbox event in milliseconds",
  registers: [workerMetricsRegistry],
});

export const bullmqQueueDepth = new Gauge({
  name: "wbc_bullmq_queue_depth",
  help: "BullMQ queue depth by state (waiting/active/delayed/failed)",
  labelNames: ["queue", "state"] as const,
  registers: [workerMetricsRegistry],
});

// ACH-004 observabilidade-operacao: contador de eventos migrados para
// DLQ, agrupados por queue. Permite alerta wbc_dlq_events_total > 10.
export const dlqEventsTotal = new Counter({
  name: "wbc_dlq_events_total",
  help: "Total events migrated to DLQ, by queue",
  labelNames: ["queue"] as const,
  registers: [workerMetricsRegistry],
});
