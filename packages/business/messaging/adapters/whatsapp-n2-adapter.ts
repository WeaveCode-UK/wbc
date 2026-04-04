import type { WhatsAppPort, SendMessageResult } from '../ports/whatsapp-port';
import { formatPhoneForWhatsApp } from '../domain/whatsapp';

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';

export class WhatsAppN2Adapter implements WhatsAppPort {
  private readonly apiToken: string;
  private readonly phoneNumberId: string;

  constructor() {
    this.apiToken = process.env.WHATSAPP_API_TOKEN ?? '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID ?? '';
  }

  private async sendMessage(phone: string, type: string, content: Record<string, unknown>): Promise<SendMessageResult> {
    const cleanPhone = formatPhoneForWhatsApp(phone);
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
        },
      );

      if (!response.ok) return { success: false };
      const data = await response.json() as { messages?: Array<{ id: string }> };
      return { success: true, messageId: data.messages?.[0]?.id };
    } catch {
      return { success: false };
    }
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
