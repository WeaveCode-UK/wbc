export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  /**
   * ACH-016 apis-integracoes: when the caller has a stable per-attempt
   * identity (e.g. a domain event id or `outboxEvent.id`), pass it here.
   * The adapter forwards it to the provider's idempotency header so a
   * retry after a timeout doesn't deliver the message twice.
   */
  idempotencyKey?: string;
}

export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}
