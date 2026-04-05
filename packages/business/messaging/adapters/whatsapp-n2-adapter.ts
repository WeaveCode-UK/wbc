import type { WhatsAppPort, SendMessageResult } from '../ports/whatsapp-port';
import { formatPhoneForWhatsApp } from '../domain/whatsapp';

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';
const TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1_000;

function isRetryable(status: number): boolean {
  return status >= 500 || status === 429;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class WhatsAppN2Adapter implements WhatsAppPort {
  private readonly apiToken: string;
  private readonly phoneNumberId: string;

  constructor() {
    this.apiToken = process.env.WHATSAPP_API_TOKEN ?? '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID ?? '';
  }

  private async sendMessage(phone: string, type: string, content: Record<string, unknown>): Promise<SendMessageResult> {
    const cleanPhone = formatPhoneForWhatsApp(phone);

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const response = await fetch(
          `${WHATSAPP_API_URL}/${this.phoneNumberId}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.apiToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: cleanPhone,
              type,
              [type]: content,
            }),
            signal: controller.signal,
          },
        );

        clearTimeout(timeout);

        if (!response.ok) {
          console.error(`[WhatsApp] Send failed: status=${response.status} phone=${cleanPhone} type=${type} attempt=${attempt + 1}`);
          if (isRetryable(response.status) && attempt < MAX_RETRIES) {
            await sleep(RETRY_DELAY_MS * (attempt + 1));
            continue;
          }
          return { success: false };
        }

        const data = await response.json() as { messages?: Array<{ id: string }> };
        return { success: true, messageId: data.messages?.[0]?.id };
      } catch (error) {
        clearTimeout(timeout);
        console.error(`[WhatsApp] Send error: phone=${cleanPhone} type=${type} attempt=${attempt + 1}`, error instanceof Error ? error.message : error);
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * (attempt + 1));
          continue;
        }
        return { success: false };
      }
    }

    return { success: false };
  }

  async sendText(phone: string, message: string): Promise<SendMessageResult> {
    return this.sendMessage(phone, 'text', { body: message });
  }

  async sendImage(phone: string, imageUrl: string, caption?: string): Promise<SendMessageResult> {
    return this.sendMessage(phone, 'image', { link: imageUrl, caption });
  }

  async sendAudio(phone: string, audioUrl: string): Promise<SendMessageResult> {
    return this.sendMessage(phone, 'audio', { link: audioUrl });
  }
}
