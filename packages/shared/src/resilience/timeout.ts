// TimeoutPolicy — timeouts centralizados (ACH-008).
// Uso: passar `signal` para fetch/APIs que suportam AbortSignal.

export interface TimeoutPolicy {
  /** Timeout total por tentativa (ms). */
  timeoutMs: number;
}

export const DEFAULT_TIMEOUT_POLICY: TimeoutPolicy = {
  timeoutMs: 10_000,
};

/**
 * Cria um AbortController com timeout auto-aplicado. Retorna o signal e um função
 * `cancel` que deve ser chamada (idealmente em `finally`) para limpar o timer caso
 * a operação complete antes do timeout.
 */
export function createTimeoutSignal(
  policy: TimeoutPolicy = DEFAULT_TIMEOUT_POLICY,
): {
  signal: AbortSignal;
  cancel: () => void;
} {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), policy.timeoutMs);
  return {
    signal: controller.signal,
    cancel: () => clearTimeout(timer),
  };
}
