/**
 * Post-audit (ACH-003 custos-finops): tabela de preços WhatsApp por
 * categoria × país. Baseada em meta.com/business/help/whatsapp-business
 * pricing (verificado em 2026-04-24 para Brasil).
 *
 * Valores atualizam trimestralmente. Humano atualiza esta constante + abre
 * PR com `docs` scope. PR que toca este arquivo deve atualizar
 * `docs/PRICING.md` seção 3.1 junto.
 */

import type { WhatsAppConversationCategory } from "../ports/message-billing";

export type CountryCode = "BR" | "US" | "UK" | "DEFAULT";

export const WHATSAPP_PRICING: Record<
  CountryCode,
  Record<WhatsAppConversationCategory, number>
> = {
  BR: {
    utility: 0.008,
    marketing: 0.04,
    service: 0.0, // janela 24h grátis após incoming
    authentication: 0.018,
  },
  US: {
    utility: 0.019,
    marketing: 0.0225,
    service: 0.0,
    authentication: 0.0135,
  },
  UK: {
    utility: 0.0342,
    marketing: 0.0573,
    service: 0.0,
    authentication: 0.0324,
  },
  // Fallback conservador (mais alto dentre os conhecidos) — evita subestimar.
  DEFAULT: {
    utility: 0.0342,
    marketing: 0.0573,
    service: 0.0,
    authentication: 0.0324,
  },
};

export function priceForConversation(
  country: CountryCode,
  category: WhatsAppConversationCategory,
  conversationAlreadyOpen: boolean,
): number {
  if (category === "service" && conversationAlreadyOpen) return 0;
  const tableByCountry = WHATSAPP_PRICING[country] ?? WHATSAPP_PRICING.DEFAULT;
  return tableByCountry[category];
}

/**
 * Heurística simples — não é garantida, mas dá um chute razoável até um
 * integration test validar contra webhook da Meta.
 */
export function classifyCountryByPhone(e164Phone: string): CountryCode {
  if (e164Phone.startsWith("+55")) return "BR";
  if (e164Phone.startsWith("+1")) return "US";
  if (e164Phone.startsWith("+44")) return "UK";
  return "DEFAULT";
}
