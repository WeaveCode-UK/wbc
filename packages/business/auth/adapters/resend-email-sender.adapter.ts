import { createLogger, requireEnv } from "@wbc/shared";
import type { EmailSender, EmailMessage } from "../ports/email-sender.port";

const logger = createLogger("email-sender");

const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_DEFAULT = "WBC <noreply@weavecode.co.uk>";

export class ResendNotConfiguredError extends Error {
  constructor() {
    super(
      "ResendEmailSender: RESEND_API_KEY is required in production. " +
        "Set the env var or wire a different EmailSender implementation.",
    );
    this.name = "ResendNotConfiguredError";
  }
}

/**
 * Resend-backed email sender. In production it calls the Resend HTTP API and
 * raises if the API key is missing — silent failure (the previous behaviour)
 * meant transactional flows like password reset would *appear* to work while
 * never actually sending mail (ACH-001).
 *
 * In dev/test it logs the message metadata via the central logger; the
 * message body is not logged because it can carry tokens and links.
 */
export class ResendEmailSender implements EmailSender {
  private readonly apiKey?: string;
  private readonly fromAddress: string;

  constructor(opts: { apiKey?: string; from?: string } = {}) {
    if (process.env.NODE_ENV === "production") {
      this.apiKey = opts.apiKey ?? requireEnv("RESEND_API_KEY");
    } else {
      this.apiKey = opts.apiKey ?? process.env.RESEND_API_KEY;
    }
    this.fromAddress = opts.from ?? process.env.EMAIL_FROM ?? FROM_DEFAULT;
  }

  async send(message: EmailMessage): Promise<void> {
    if (!this.apiKey) {
      // Dev / test path: log metadata only, do not include the body.
      logger.info(
        {
          to: message.to,
          subject: message.subject,
          htmlLength: message.html.length,
        },
        "EmailSender: RESEND_API_KEY missing — message would be sent in production",
      );
      return;
    }

    // ACH-016 apis-integracoes: forward the caller-provided idempotency
    // key to Resend. When absent, we don't fabricate one — two separate
    // logical sends (e.g. user triggers "resend verification email"
    // twice on purpose) shouldn't be collapsed. Resend only deduplicates
    // when the header is present and identical.
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
    if (message.idempotencyKey) {
      headers["Idempotency-Key"] = message.idempotencyKey;
    }

    // ACH-048: bound the outbound fetch so a slow / hung Resend cannot
    // pin the request handler or worker indefinitely. 5 s is plenty for a
    // transactional send; AbortController unrolls on completion either way.
    const RESEND_TIMEOUT_MS = 5000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), RESEND_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(RESEND_API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
          from: this.fromAddress,
          to: [message.to],
          subject: message.subject,
          html: message.html,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      logger.error(
        { status: response.status, error: errorBody.slice(0, 500) },
        "Resend API returned non-OK",
      );
      throw new Error(`Resend API error: ${response.status}`);
    }
  }
}
