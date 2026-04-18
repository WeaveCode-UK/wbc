// RetryPolicy — política centralizada de retry (ACH-008).
// Substitui constantes hardcoded (MAX_RETRIES, RETRY_DELAY_MS, isRetryable)
// espalhadas por adapters. Permite overrides por provider e configuração por env.

export interface RetryPolicy {
  /** Tentativas extras além da inicial. `maxRetries=2` significa até 3 tentativas totais. */
  maxRetries: number;
  /** Base de delay em ms (multiplicado pelo número da tentativa em backoff linear). */
  baseDelayMs: number;
  /** Decide se um HTTP status code deve disparar retry. */
  isRetryableStatus?: (status: number) => boolean;
  /** Decide se um erro arbitrário (não-HTTP) deve disparar retry. Default: sempre retentar. */
  isRetryableError?: (error: unknown) => boolean;
}

/** Status HTTP considerado retryable por padrão: 5xx + 429 (rate limit). */
export function defaultIsRetryableStatus(status: number): boolean {
  return status >= 500 || status === 429;
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 2,
  baseDelayMs: 1_000,
  isRetryableStatus: defaultIsRetryableStatus,
  isRetryableError: () => true,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface RetryAttempt {
  attempt: number; // 0 = primeira tentativa
  lastError?: unknown;
  lastStatus?: number;
}

/**
 * Resultado que o callback `fn` pode retornar para informar à política como proceder.
 * - `ok`: sucesso, não tentar novamente.
 * - `retryStatus`: falha HTTP; a política decide (via `isRetryableStatus`) se retenta.
 * - `fatal`: erro definitivo; não retenta mesmo que `isRetryableStatus` permitisse.
 */
export type RetryOutcome<T> =
  | { kind: "ok"; value: T }
  | { kind: "retryStatus"; status: number }
  | { kind: "fatal"; value: T };

/**
 * Executa `fn` com retry linear-backoff conforme `policy`. Backoff = baseDelayMs * (attempt+1).
 * O caller controla o que é "sucesso" vs "retry" vs "fatal" retornando `RetryOutcome`.
 * Erros lançados são considerados retryable se `isRetryableError` permitir; caso contrário
 * propagam imediatamente.
 */
export async function withRetry<T>(
  fn: (attempt: RetryAttempt) => Promise<RetryOutcome<T>>,
  policy: RetryPolicy = DEFAULT_RETRY_POLICY,
): Promise<T> {
  const isRetryableStatus =
    policy.isRetryableStatus ?? defaultIsRetryableStatus;
  const isRetryableError = policy.isRetryableError ?? (() => true);

  let lastResult: T | undefined;
  let lastError: unknown;
  let lastStatus: number | undefined;

  for (let attempt = 0; attempt <= policy.maxRetries; attempt++) {
    try {
      const outcome = await fn({ attempt, lastError, lastStatus });
      if (outcome.kind === "ok") return outcome.value;
      if (outcome.kind === "fatal") return outcome.value;
      // retryStatus
      lastStatus = outcome.status;
      if (!isRetryableStatus(outcome.status) || attempt >= policy.maxRetries) {
        // não retryable ou esgotou tentativas — devolve estado como fatal do caller
        // (o caller deve ter preparado `fn` para retornar `fatal` neste caso; aqui
        // damos um fallback lançando erro).
        throw new RetryExhaustedError(attempt + 1, lastStatus, lastError);
      }
    } catch (error) {
      lastError = error;
      if (!isRetryableError(error) || attempt >= policy.maxRetries) {
        throw error;
      }
    }

    await sleep(policy.baseDelayMs * (attempt + 1));
  }

  // Saída defensiva: em teoria unreachable (loop sempre retorna ou lança).
  throw new RetryExhaustedError(policy.maxRetries + 1, lastStatus, lastError);
}

export class RetryExhaustedError extends Error {
  constructor(
    public readonly attempts: number,
    public readonly lastStatus?: number,
    public readonly lastError?: unknown,
  ) {
    super(
      `Retry exhausted after ${attempts} attempts` +
        (lastStatus !== undefined ? ` (last status=${lastStatus})` : "") +
        (lastError instanceof Error ? `: ${lastError.message}` : ""),
    );
    this.name = "RetryExhaustedError";
  }
}
