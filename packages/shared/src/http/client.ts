// ACH-015 apis-integracoes: unified HTTP client used by every adapter that
// talks to an external service. `fetch()` in Node has no default timeout —
// a stalled server will tie up a worker indefinitely, starving BullMQ.
//
// This helper composes the existing resilience primitives (timeout + retry)
// into the one shape adapters actually need:
//   - AbortSignal with a per-attempt deadline (default 10 s)
//   - linear-backoff retry on 5xx/429 and on fetch-level errors
//   - deterministic request id passed as a header (idempotency-friendly)
//
// Adapters keep calling `fetch()` directly when they need surface the exact
// body/status (e.g. WhatsAppN2Adapter inspects 4xx differently); most new
// integrations should reach for `fetchWithTimeout()` instead.

import {
  DEFAULT_RETRY_POLICY,
  DEFAULT_TIMEOUT_POLICY,
  createTimeoutSignal,
  defaultIsRetryableStatus,
  type RetryPolicy,
  type TimeoutPolicy,
} from "../resilience";

export interface FetchWithTimeoutOptions {
  timeout?: TimeoutPolicy;
  retry?: RetryPolicy;
  /** Header sent as X-Request-Id on every attempt (same id across retries). */
  requestId?: string;
  /** Name of the header used for requestId. Default: "X-Request-Id". */
  requestIdHeader?: string;
}

export interface FetchWithTimeoutResult {
  response: Response;
  /** Number of attempts made (1 = success on first try). */
  attempts: number;
  /** The requestId sent on the wire (generated if caller didn't pass one). */
  requestId: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateRequestId(): string {
  // Cheap, collision-resistant-enough id for request correlation. Callers
  // that need ULID/UUID strictness should pass their own `requestId`.
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * `fetch` wrapper with per-attempt timeout, linear-backoff retry on retryable
 * statuses, and a stable request-id header propagated across retries.
 *
 * Contract:
 *  - The returned `response` is whatever fetch returned on the final attempt
 *    (success, or the last failure). Caller decides how to interpret 4xx.
 *  - If every attempt throws (network error, timeout), the last error is
 *    rethrown — caller does not need to unwrap a result envelope.
 */
export async function fetchWithTimeout(
  input: string | URL,
  init: RequestInit = {},
  options: FetchWithTimeoutOptions = {},
): Promise<FetchWithTimeoutResult> {
  const timeoutPolicy = options.timeout ?? DEFAULT_TIMEOUT_POLICY;
  const retryPolicy = options.retry ?? DEFAULT_RETRY_POLICY;
  const isRetryableStatus =
    retryPolicy.isRetryableStatus ?? defaultIsRetryableStatus;
  const isRetryableError = retryPolicy.isRetryableError ?? (() => true);
  const requestId = options.requestId ?? generateRequestId();
  const requestIdHeader = options.requestIdHeader ?? "X-Request-Id";

  const baseHeaders = new Headers(init.headers ?? undefined);
  baseHeaders.set(requestIdHeader, requestId);

  let lastError: unknown;
  let lastResponse: Response | undefined;

  for (let attempt = 0; attempt <= retryPolicy.maxRetries; attempt++) {
    const { signal, cancel } = createTimeoutSignal(timeoutPolicy);
    try {
      const response = await fetch(input, {
        ...init,
        headers: baseHeaders,
        signal,
      });
      cancel();

      if (
        !isRetryableStatus(response.status) ||
        attempt >= retryPolicy.maxRetries
      ) {
        return { response, attempts: attempt + 1, requestId };
      }
      lastResponse = response;
    } catch (error) {
      cancel();
      lastError = error;
      if (!isRetryableError(error) || attempt >= retryPolicy.maxRetries) {
        throw error;
      }
    }

    await sleep(retryPolicy.baseDelayMs * (attempt + 1));
  }

  // Only reachable if the last attempt produced a retryable status without
  // exception; return that response rather than throwing, matching the
  // "final response wins" contract above.
  if (lastResponse) {
    return {
      response: lastResponse,
      attempts: retryPolicy.maxRetries + 1,
      requestId,
    };
  }
  throw lastError ?? new Error("fetchWithTimeout exhausted without response");
}
