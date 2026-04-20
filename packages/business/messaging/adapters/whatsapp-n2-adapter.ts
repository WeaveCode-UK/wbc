import type {
  WhatsAppPort,
  SendMessageResult,
  SendMessageOptions,
} from "../ports/whatsapp-port";
import { formatPhoneForWhatsApp } from "../domain/whatsapp";
import {
  CircuitBreaker,
  type RetryPolicy,
  type TimeoutPolicy,
  createTimeoutSignal,
  whatsappRetryPolicy,
  whatsappTimeoutPolicy,
  requireEnv,
  createLogger,
  redactPhone,
  // ACH-019 apis-integracoes: schema lives in @wbc/shared because
  // packages/business has no package.json and therefore can't import
  // zod directly. Shared already declares the dep.
  WhatsAppSendResponseSchema,
} from "@wbc/shared";

const logger = createLogger("whatsapp-adapter");
let requestCounter = 0;
const nextRequestId = (): string =>
  `whreq_${Date.now().toString(36)}_${++requestCounter}`;

const WHATSAPP_API_URL = "https://graph.facebook.com/v18.0";

// CircuitBreaker para WhatsApp: 5 falhas em 60s abre o circuito.
// Thresholds centralizados aqui por enquanto; no futuro podem vir de @wbc/shared/resilience/policies.ts.
const whatsappCircuit = new CircuitBreaker("whatsapp", {
  failureThreshold: 5,
  resetTimeoutMs: 60_000,
});

function isRetryableStatus(status: number): boolean {
  return status >= 500 || status === 429;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class WhatsAppN2Adapter implements WhatsAppPort {
  private readonly apiToken: string;
  private readonly phoneNumberId: string;
  private readonly retryPolicy: RetryPolicy;
  private readonly timeoutPolicy: TimeoutPolicy;

  constructor(policies: { retry?: RetryPolicy; timeout?: TimeoutPolicy } = {}) {
    // In production, fail fast if credentials are missing rather than letting
    // requests reach Meta with empty Bearer tokens (which return 401 silently
    // and look like flaky integration).
    if (process.env.NODE_ENV === "production") {
      this.apiToken = requireEnv("WHATSAPP_API_TOKEN");
      this.phoneNumberId = requireEnv("WHATSAPP_PHONE_NUMBER_ID");
    } else {
      this.apiToken = process.env.WHATSAPP_API_TOKEN ?? "";
      this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID ?? "";
    }
    this.retryPolicy = policies.retry ?? whatsappRetryPolicy;
    this.timeoutPolicy = policies.timeout ?? whatsappTimeoutPolicy;
  }

  private async sendMessage(
    phone: string,
    type: string,
    content: Record<string, unknown>,
    opts: SendMessageOptions = {},
  ): Promise<SendMessageResult> {
    const cleanPhone = formatPhoneForWhatsApp(phone);
    const { maxRetries, baseDelayMs } = this.retryPolicy;
    // ACH-016 apis-integracoes: prefer the caller's stable idempotency
    // key (e.g. outbox event id) so retries coalesce on Meta's side.
    // Fall back to the per-call counter when no key is supplied — that
    // path still avoids *collisions*, but it doesn't dedup across
    // outbox retries (which is why callers should pass their own key
    // for anything that actually matters).
    const requestId = opts.idempotencyKey ?? nextRequestId();
    const phoneRedacted = redactPhone(cleanPhone);

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const { signal, cancel } = createTimeoutSignal(this.timeoutPolicy);

      try {
        const response = await fetch(
          `${WHATSAPP_API_URL}/${this.phoneNumberId}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${this.apiToken}`,
              "Content-Type": "application/json",
              // ACH-016 apis-integracoes: same id across retries inside
              // this call; when `opts.idempotencyKey` is set, also same
              // across outbox-driven retries.
              "X-Request-Id": requestId,
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: cleanPhone,
              type,
              [type]: content,
            }),
            signal,
          },
        );

        cancel();

        if (!response.ok) {
          logger.warn(
            {
              requestId,
              status: response.status,
              phone: phoneRedacted,
              type,
              attempt: attempt + 1,
            },
            "WhatsApp send failed",
          );
          if (isRetryableStatus(response.status) && attempt < maxRetries) {
            await sleep(baseDelayMs * (attempt + 1));
            continue;
          }
          return { success: false };
        }

        const raw = await response.json();
        const parsed = WhatsAppSendResponseSchema.safeParse(raw);
        if (!parsed.success) {
          logger.error(
            {
              requestId,
              phone: phoneRedacted,
              type,
              zodError: parsed.error.message,
            },
            "WhatsApp response shape unexpected — treating as failure",
          );
          return { success: false };
        }
        // `messages.min(1)` in the schema guarantees [0] exists; the
        // non-null assertion is safe and dodges TS's narrowing miss
        // through the intersection of schema types.
        return { success: true, messageId: parsed.data.messages[0]!.id };
      } catch (error) {
        cancel();
        logger.error(
          {
            requestId,
            phone: phoneRedacted,
            type,
            attempt: attempt + 1,
            err: error instanceof Error ? error.message : String(error),
          },
          "WhatsApp send error",
        );
        if (attempt < maxRetries) {
          await sleep(baseDelayMs * (attempt + 1));
          continue;
        }
        return { success: false };
      }
    }

    return { success: false };
  }

  async sendText(
    phone: string,
    message: string,
    opts?: SendMessageOptions,
  ): Promise<SendMessageResult> {
    return whatsappCircuit.execute(
      () => this.sendMessage(phone, "text", { body: message }, opts),
      () => ({ success: false }) as SendMessageResult,
    );
  }

  async sendImage(
    phone: string,
    imageUrl: string,
    caption?: string,
    opts?: SendMessageOptions,
  ): Promise<SendMessageResult> {
    return whatsappCircuit.execute(
      () => this.sendMessage(phone, "image", { link: imageUrl, caption }, opts),
      () => ({ success: false }) as SendMessageResult,
    );
  }

  async sendAudio(
    phone: string,
    audioUrl: string,
    opts?: SendMessageOptions,
  ): Promise<SendMessageResult> {
    return whatsappCircuit.execute(
      () => this.sendMessage(phone, "audio", { link: audioUrl }, opts),
      () => ({ success: false }) as SendMessageResult,
    );
  }
}
