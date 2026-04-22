import {
  Registry,
  Counter,
  Histogram,
  Gauge,
  collectDefaultMetrics,
} from "prom-client";

export const metricsRegistry = new Registry();

collectDefaultMetrics({ register: metricsRegistry });

export const httpRequestDuration = new Histogram({
  name: "wbc_trpc_request_duration_seconds",
  help: "Duration of tRPC requests in seconds",
  labelNames: ["path", "type", "status"] as const,
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [metricsRegistry],
});

export const httpRequestTotal = new Counter({
  name: "wbc_trpc_requests_total",
  help: "Total number of tRPC requests",
  labelNames: ["path", "type", "status"] as const,
  registers: [metricsRegistry],
});

export const domainErrorTotal = new Counter({
  name: "wbc_domain_errors_total",
  help: "Total number of domain errors by type",
  labelNames: ["error_class"] as const,
  registers: [metricsRegistry],
});

export const activeConnections = new Counter({
  name: "wbc_active_connections_total",
  help: "Total WebSocket/SSE connections",
  registers: [metricsRegistry],
});

// ACH-005 observabilidade-operacao: gauges de infra expostos no API.
// Populados por helpers em background (prisma middleware, redis hook)
// — follow-up humano para instrumentar as chamadas (docs/OBSERVABILITY-FOLLOWUP.md).
export const prismaPoolSize = new Gauge({
  name: "wbc_prisma_pool_size",
  help: "Prisma connection pool active connections",
  registers: [metricsRegistry],
});

export const redisActiveConnections = new Gauge({
  name: "wbc_redis_active_connections",
  help: "Active Redis client connections from this process",
  registers: [metricsRegistry],
});

// Espelho de wbc_outbox_lag_ms (worker) no API quando outbox-lag-monitor
// estiver rodando — útil para dashboards que consomem métricas do API.
export const outboxLagMs = new Gauge({
  name: "wbc_outbox_lag_ms",
  help: "Age of the oldest unprocessed outbox event in milliseconds (API side)",
  registers: [metricsRegistry],
});

export const cacheHitTotal = new Counter({
  name: "wbc_cache_hits_total",
  help: "Cache hits by store",
  labelNames: ["store"] as const,
  registers: [metricsRegistry],
});

export const cacheMissTotal = new Counter({
  name: "wbc_cache_misses_total",
  help: "Cache misses by store",
  labelNames: ["store"] as const,
  registers: [metricsRegistry],
});
