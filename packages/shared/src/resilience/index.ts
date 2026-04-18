// Resilience primitives — retry, timeout, circuit breaker — ADR-001/ADR-007.
// Centralizacao criada pelo ACH-008 para substituir constantes hardcoded
// espalhadas por adapters externos (WhatsApp, DeepSeek, etc.).

export type { RetryPolicy, RetryAttempt, RetryOutcome } from "./retry";
export {
  DEFAULT_RETRY_POLICY,
  defaultIsRetryableStatus,
  withRetry,
  RetryExhaustedError,
} from "./retry";

export type { TimeoutPolicy } from "./timeout";
export { DEFAULT_TIMEOUT_POLICY, createTimeoutSignal } from "./timeout";

export {
  whatsappRetryPolicy,
  whatsappTimeoutPolicy,
  deepseekRetryPolicy,
  deepseekTimeoutPolicy,
} from "./policies";

// CircuitBreaker continua exportado de '@wbc/shared' diretamente (circuit-breaker.ts).
// Não re-exportamos aqui para evitar conflito de símbolos no barrel.
