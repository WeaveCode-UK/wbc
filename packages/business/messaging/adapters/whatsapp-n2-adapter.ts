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

  async sendText(phone: string, message: string): Promise<SendMessageResult> {
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
            type: 'text',
            text: { body: message },
          }),
        },
      );

      if (!response.ok) {
        return { success: false };
      }

      const data = await response.json() as { messages?: Array<{ id: string }> };
      return { success: true, messageId: data.messages?.[0]?.id };
    } catch {
      return { success: false };
    }
  }

  async sendImage(phone: string, imageUrl: string, caption?: string): Promise<SendMessageResult> {
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
            type: 'image',
            image: { link: imageUrl, caption },
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

  async sendAudio(phone: string, audioUrl: string): Promise<SendMessageResult> {
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
            type: 'audio',
            audio: { link: audioUrl },
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
}
