import { createHmac, timingSafeEqual } from 'crypto';

// Meta API webhook handler for message status updates
export interface WhatsAppWebhookPayload {
  entry?: Array<{
    changes?: Array<{
      value?: {
        statuses?: Array<{
          id: string;
          status: 'sent' | 'delivered' | 'read' | 'failed';
          timestamp: string;
        }>;
      };
    }>;
  }>;
}

export class WebhookSignatureError extends Error {
  constructor() {
    super('Invalid webhook signature');
    this.name = 'WebhookSignatureError';
  }
}

export function verifyWebhookSignature(rawBody: string, signature: string | undefined): void {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) {
    throw new Error('WHATSAPP_APP_SECRET is not configured');
  }

  if (!signature) {
    throw new WebhookSignatureError();
  }

  const expectedSignature = 'sha256=' + createHmac('sha256', appSecret).update(rawBody).digest('hex');

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
    throw new WebhookSignatureError();
  }
}

export function parseWebhookStatuses(payload: WhatsAppWebhookPayload): Array<{ messageId: string; status: string }> {
  const statuses: Array<{ messageId: string; status: string }> = [];

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const status of change.value?.statuses ?? []) {
        statuses.push({ messageId: status.id, status: status.status });
      }
    }
  }

  return statuses;
}
