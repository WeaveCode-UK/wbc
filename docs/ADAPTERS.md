# Adapters Externos — Convenção

Adapters que falam com serviços externos (HTTP, SDK de terceiro) devem combinar quatro primitivas de resiliência:

1. **Timeout por chamada** (`TimeoutPolicy` + `createTimeoutSignal`)
2. **Retry com backoff** (`RetryPolicy` + `withRetry`)
3. **Circuit breaker** (`CircuitBreaker` + `CircuitBreakerPolicy`)
4. **Fallback** (estratégia de degradação graciosa)

## Duas formas de aplicar

### 1. Primitivas avulsas (ACH-008 original)

Usado pelos adapters existentes (`WhatsAppN2Adapter`, `DeepSeekAdapter`). O adapter orquestra manualmente, ganhando flexibilidade mas pagando em duplicação.

### 2. Template abstrato (ACH-014 confiabilidade-resiliencia)

```ts
import { ExternalAdapterTemplate, type ExternalCallContext } from "@wbc/shared";
import {
  whatsappRetryPolicy,
  whatsappTimeoutPolicy,
  whatsappCircuitPolicy,
} from "@wbc/shared";

export class MercadoPagoAdapter extends ExternalAdapterTemplate<PaymentResult> {
  constructor() {
    super({
      name: "mercadopago",
      retry: { maxRetries: 2, baseDelayMs: 1_000 },
      timeout: { timeoutMs: 15_000 },
      circuit: { failureThreshold: 5, resetTimeoutMs: 60_000 },
    });
  }

  protected async doCall(ctx: ExternalCallContext) {
    const resp = await fetch(MP_URL, { signal: ctx.signal });
    if (resp.status >= 500 || resp.status === 429) {
      return { kind: "retryStatus", status: resp.status };
    }
    return { kind: "ok", value: await resp.json() };
  }

  protected onFallback(err: unknown) {
    // Degradar para "pagamento pendente" em vez de lançar
    return { status: "pending", reason: String(err) };
  }
}
```

## Regra de code-review

- Nova integração externa deve estender `ExternalAdapterTemplate` **ou** justificar no PR por que orquestra manualmente.
- Se justificar manualmente, precisa aplicar as 4 primitivas (não basta timeout).

## Stubs atuais

- `packages/business/auth/adapters/resend-email-sender.adapter.ts` — stub; ao sair de stub, migrar para template.
- `packages/business/finance/*` — MercadoPago adapter ainda ausente; criar via template quando contrato estiver estável.

Ver `docs/RELIABILITY-FOLLOWUP.md` para rastreamento.
