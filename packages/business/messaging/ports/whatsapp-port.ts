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
 */
export interface SendMessageOptions {
  idempotencyKey?: string;
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
