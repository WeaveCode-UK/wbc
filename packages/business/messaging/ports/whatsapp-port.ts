export interface SendMessageResult {
  success: boolean;
  whatsappLink?: string;
  messageId?: string;
}

/**
 * ACH-016 apis-integracoes: optional per-send hints the caller can pass
 * to keep retries idempotent on the provider side. When
 * `idempotencyKey` is set, the adapter forwards it to the provider
 * (Meta: `X-Request-Id`) so a duplicate send after a timeout is
 * coalesced upstream instead of delivering the same WhatsApp message
 * twice.
 *
 * ACH-015 confiabilidade-resiliencia: `deadlineSignal` carries a
 * caller-supplied AbortSignal (typically from `withDeadline`) so the
 * adapter aborts in-flight HTTP before the caller's budget is blown.
 * When passed, the adapter combines it with its own per-attempt
 * timeout — whichever fires first wins. Without it the adapter keeps
 * its pre-existing timeout-only behavior (backwards compatible).
 */
export interface SendMessageOptions {
  idempotencyKey?: string;
  deadlineSignal?: AbortSignal;
}

export interface WhatsAppPort {
  sendText(
    phone: string,
    message: string,
    opts?: SendMessageOptions,
  ): Promise<SendMessageResult>;
  sendImage(
    phone: string,
    imageUrl: string,
    caption?: string,
    opts?: SendMessageOptions,
  ): Promise<SendMessageResult>;
  sendAudio(
    phone: string,
    audioUrl: string,
    opts?: SendMessageOptions,
  ): Promise<SendMessageResult>;
}
