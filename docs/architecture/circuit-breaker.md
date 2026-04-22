# Circuit Breaker Adoption (ACH-027 performance-escalabilidade)

## What's in place

`packages/shared/src/circuit-breaker.ts` implements the pattern:
N consecutive failures within a window open the circuit, subsequent
calls short-circuit with a fallback, the circuit half-closes after a
cooldown.

`WhatsAppN2Adapter` already wraps every call:

```ts
const whatsappCircuit = new CircuitBreaker("whatsapp", {
  failureThreshold: 5,
  resetTimeoutMs: 60_000,
});
```

## Adapters still raw

- `DeepseekAdapter` — AI inference, minutes-long timeouts already;
  should open on two consecutive timeouts.
- `ResendEmailSender` — email delivery, important to isolate so a
  Resend outage doesn't block the messaging processor.
- Future MercadoPago client — payments, critical surface.

## Recipe

```ts
import { CircuitBreaker } from "@wbc/shared";

const breaker = new CircuitBreaker("deepseek", {
  failureThreshold: 3,
  resetTimeoutMs: 30_000,
});

async function generate(prompt: string) {
  return breaker.execute(
    () => fetchDeepseek(prompt),
    () => ({ ok: false, reason: "circuit_open" }),
  );
}
```

The fallback should drop into a safe default — returning "this
feature is temporarily unavailable" to the user — and emit a
structured warn so the monitoring catches the open circuit before
a user reports it.

## Follow-up

- Wrap DeepSeek and Resend adapters.
- Per-circuit metric (`circuit_state{name=...}`) exported to
  Prometheus so alert rules can page on an open circuit lasting > 5 min.
- Cross-ref with `docs/architecture/dlq-replay.md` — when a circuit
  opens and events keep arriving, they should land in the DLQ rather
  than drop silently.
