import { Registry, Counter, Histogram, collectDefaultMetrics } from 'prom-client';

export const metricsRegistry = new Registry();

collectDefaultMetrics({ register: metricsRegistry });

export const httpRequestDuration = new Histogram({
  name: 'wbc_trpc_request_duration_seconds',
  help: 'Duration of tRPC requests in seconds',
  labelNames: ['path', 'type', 'status'] as const,
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [metricsRegistry],
});

export const httpRequestTotal = new Counter({
  name: 'wbc_trpc_requests_total',
  help: 'Total number of tRPC requests',
  labelNames: ['path', 'type', 'status'] as const,
  registers: [metricsRegistry],
});

export const domainErrorTotal = new Counter({
  name: 'wbc_domain_errors_total',
  help: 'Total number of domain errors by type',
  labelNames: ['error_class'] as const,
  registers: [metricsRegistry],
});

export const activeConnections = new Counter({
  name: 'wbc_active_connections_total',
  help: 'Total WebSocket/SSE connections',
  registers: [metricsRegistry],
});
