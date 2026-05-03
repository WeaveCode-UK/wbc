import { prisma } from "@wbc/db";

// Bloco 2 do plano: lógica compartilhada entre sale-confirmation-handler
// e messaging-processor para decidir se um envio vai pelo Meta Cloud (N2)
// ou cai pra notificação pra consultora copiar/colar (N1).
//
// Critério: tenant Pro com WHATSAPP_API_TOKEN no env → N2. Caso contrário
// (Essential, Pro sem token, ou env sem credencial) → N1.
//
// Envelope simples — não instancia o adapter aqui pra manter a função
// puramente lógica (mais fácil de testar).

export type WhatsAppChannel = "N2" | "N1";

export async function selectWhatsAppChannel(
  tenantId: string,
): Promise<WhatsAppChannel> {
  if (!process.env.WHATSAPP_API_TOKEN) return "N1";
  const subscription = await prisma.subscription.findUnique({
    where: { tenantId },
    select: { plan: true, status: true },
  });
  if (subscription?.plan === "PRO" && subscription.status === "ACTIVE") {
    return "N2";
  }
  return "N1";
}
