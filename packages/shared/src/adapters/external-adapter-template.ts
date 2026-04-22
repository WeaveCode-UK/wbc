// ACH-014 confiabilidade-resiliencia: template abstrato para adapters
// externos. Combina timeout + retry + circuit breaker + fallback em
// um ponto único, evitando divergência entre integrações (WhatsApp,
// DeepSeek, MercadoPago, Resend).
//
// Um adapter concreto herda esta classe e fornece `doCall()`. O
// template cuida da orquestração: cria signal com timeout, executa
// `doCall()` envolto em retry + circuit. `onFallback()` opcional
// converte falha em resultado de degradação graciosa.
//
// Escopo: adapters HTTP stateless. Para operações transacionais
// próprias, use os primitivos avulsos (withRetry, CircuitBreaker).

import { CircuitBreaker } from "../circuit-breaker";
import { createTimeoutSignal, type TimeoutPolicy } from "../resilience/timeout";
import {
  withRetry,
  type RetryPolicy,
  type RetryOutcome,
} from "../resilience/retry";
import type { CircuitBreakerPolicy } from "../resilience/policies";

export interface ExternalAdapterConfig {
  name: string;
  retry: RetryPolicy;
  timeout: TimeoutPolicy;
  circuit: CircuitBreakerPolicy;
}

export interface ExternalCallContext {
  signal: AbortSignal;
  attempt: number;
}

export abstract class ExternalAdapterTemplate<TResult> {
  private readonly circuit: CircuitBreaker;

  constructor(protected readonly config: ExternalAdapterConfig) {
    this.circuit = new CircuitBreaker(config.name, config.circuit);
  }

  /**
   * Implementação concreta da chamada externa. Deve respeitar o signal
   * passado no ctx (ex: repassar a `fetch(url, { signal })`) para
   * integrar com o timeout do template.
   *
   * Deve retornar um `RetryOutcome`:
   * - `{ kind: 'ok', value }` em sucesso
   * - `{ kind: 'retryStatus', status }` para HTTP 5xx/429
   * - `{ kind: 'fatal', value }` quando falha é terminal mas o caller
   *   ainda quer um valor de degradação
   */
  protected abstract doCall(
    ctx: ExternalCallContext,
  ): Promise<RetryOutcome<TResult>>;

  /**
   * Chamado quando o circuito está aberto ou retry foi exaurido.
   * Default: re-lança o erro. Override para fallback graceful.
   */
  protected onFallback(error: unknown): TResult {
    throw error instanceof Error
      ? error
      : new Error(`Adapter ${this.config.name} failed: ${String(error)}`);
  }

  async call(): Promise<TResult> {
    try {
      return await this.circuit.execute(() =>
        withRetry<TResult>(async ({ attempt }) => {
          const { signal } = createTimeoutSignal(this.config.timeout);
          return this.doCall({ signal, attempt });
        }, this.config.retry),
      );
    } catch (err) {
      return this.onFallback(err);
    }
  }
}
