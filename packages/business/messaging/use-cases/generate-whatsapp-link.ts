import { generateDeepLink, personalizeMessage } from "../domain/whatsapp";

// F11.E11: WhatsApp N1 deep-link orchestrator. Each `kind` carries a
// canonical Portuguese template; the consultora can override via
// `customMessage` when the situation needs a personal touch. The N2
// adapter (Meta Cloud API) is a separate path.

export type WhatsappLinkKind =
  | "GENERIC"
  | "SALE_CONFIRMED"
  | "PAYMENT_REMINDER"
  | "REPOSITION_REMINDER"
  | "BIRTHDAY"
  | "DELIVERY_DISPATCHED"
  | "REACTIVATION";

const TEMPLATES: Record<WhatsappLinkKind, string> = {
  GENERIC: "Olá {{nome}}! Tudo bem? 💜",
  SALE_CONFIRMED:
    "Olá {{nome}}! Sua compra foi confirmada e já está sendo separada. Em breve te aviso a entrega! 💄",
  PAYMENT_REMINDER:
    "Oi {{nome}}, tudo bem? Passando pra te lembrar da sua parcela que vence essa semana. Posso enviar o PIX? 💳",
  REPOSITION_REMINDER:
    "{{nome}}, achei que você já deve estar acabando seu produto preferido. Quer que eu separe um novo? 💜",
  BIRTHDAY:
    "Feliz aniversário, {{nome}}! 🎉🎂 Que esse ano te traga muita beleza, saúde e sucesso. Beijo!",
  DELIVERY_DISPATCHED:
    "Oi {{nome}}, sua encomenda saiu pra entrega. Em breve chega aí! 📦💜",
  REACTIVATION:
    "{{nome}}, faz um tempinho que a gente não conversa! 💜 Tem alguma novidade que você queria experimentar?",
};

export interface GenerateWhatsappLinkInput {
  phone: string;
  clientName: string;
  kind: WhatsappLinkKind;
  customMessage?: string;
}

export function generateWhatsappLink(input: GenerateWhatsappLinkInput): {
  url: string;
  message: string;
} {
  const template = input.customMessage ?? TEMPLATES[input.kind];
  const message = personalizeMessage(template, input.clientName);
  const url = generateDeepLink(input.phone, message);
  return { url, message };
}
