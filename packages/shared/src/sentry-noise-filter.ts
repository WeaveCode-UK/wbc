/**
 * ACH-005 custos-finops: filtro de ruído para Sentry.
 *
 * A configuração anterior enviava 100% dos erros a Sentry, o que inclui 404s
 * em rotas válidas (clientes exploratórios), timeouts de rede e aborts de
 * fetch disparados quando o usuário navega. Esses eventos não são bugs e
 * consomem quota do Sentry.io sem valor de diagnóstico.
 *
 * Este filtro é chamado ANTES de `redactSentryEvent` em `beforeSend`. Quando
 * retorna `null`, o evento é descartado; caso contrário, segue para redação e
 * envio normais.
 *
 * Padrões descartados (cost-only, não são bugs):
 *   - HTTP 404 / 401 em rotas API — exploração, não erro.
 *   - ETIMEDOUT, ECONNRESET, AbortError — rede/cliente, fora do nosso controle.
 *   - ChunkLoadError — deploy recente + cliente ainda no bundle antigo.
 *   - ResizeObserver loop limit exceeded — ruído do browser.
 */

const NOISE_ERROR_NAMES = new Set([
  "AbortError",
  "ChunkLoadError",
  "ResizeObserverLoopError",
]);

const NOISE_MESSAGE_PATTERNS: RegExp[] = [
  /^ETIMEDOUT/i,
  /^ECONNRESET/i,
  /Failed to fetch/i,
  /NetworkError when attempting to fetch/i,
  /The operation was aborted/i,
  /ResizeObserver loop limit exceeded/i,
];

const NOISE_HTTP_STATUSES = new Set([401, 404]);

export type MinimalSentryEvent = {
  exception?: {
    values?: Array<{
      type?: string;
      value?: string;
    }>;
  };
  contexts?: {
    response?: {
      status_code?: number;
    };
  };
  message?: string;
};

export function isCostNoiseEvent(event: unknown): boolean {
  if (event === null || typeof event !== "object") return false;
  const e = event as MinimalSentryEvent;

  const status = e.contexts?.response?.status_code;
  if (status !== undefined && NOISE_HTTP_STATUSES.has(status)) {
    return true;
  }

  const values = e.exception?.values;
  if (Array.isArray(values)) {
    for (const v of values) {
      if (v?.type && NOISE_ERROR_NAMES.has(v.type)) return true;
      const msg = v?.value;
      if (typeof msg === "string") {
        for (const re of NOISE_MESSAGE_PATTERNS) {
          if (re.test(msg)) return true;
        }
      }
    }
  }

  if (typeof e.message === "string") {
    for (const re of NOISE_MESSAGE_PATTERNS) {
      if (re.test(e.message)) return true;
    }
  }

  return false;
}

/**
 * Uso em `beforeSend`:
 *
 *   beforeSend: (event) => filterCostNoise(event) ?? null,
 *
 * Retorna `null` se o evento é ruído; caso contrário devolve o próprio evento
 * (sem modificações — redação fica a cargo de `redactSentryEvent`).
 */
export function filterCostNoise<T>(event: T): T | null {
  return isCostNoiseEvent(event) ? null : event;
}
