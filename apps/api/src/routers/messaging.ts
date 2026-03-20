import { z } from 'zod';
import { router, protectedProcedure } from '../trpc/trpc';
import { WhatsAppN1Adapter } from '../../../../packages/business/messaging/adapters/whatsapp-n1-adapter';
import { WhatsAppN2Adapter } from '../../../../packages/business/messaging/adapters/whatsapp-n2-adapter';
import { personalizeMessage } from '../../../../packages/business/messaging/domain/whatsapp';
import type { WhatsAppPort } from '../../../../packages/business/messaging/ports/whatsapp-port';
import { prisma } from '@wbc/db';
import { uuidSchema } from '@wbc/validators';

const whatsappN1 = new WhatsAppN1Adapter();
const whatsappN2 = new WhatsAppN2Adapter();

function getWhatsAppAdapter(plan: string): WhatsAppPort {
  return plan === 'PRO' ? whatsappN2 : whatsappN1;
}

export const messagingRouter = router({
  sendToClient: protectedProcedure
    .input(z.object({
      clientId: uuidSchema,
      message: z.string().min(1),
      audioUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const client = await prisma.client.findFirst({
        where: { id: input.clientId, tenantId: ctx.tenant.tenantId },
        select: { phone: true, name: true },
      });
      if (!client) {
        return { success: false, whatsappLink: undefined, messageId: undefined };
      }

      const personalizedMessage = personalizeMessage(input.message, client.name);
      const adapter = getWhatsAppAdapter(ctx.tenant.plan);

      if (input.audioUrl) {
        return adapter.sendAudio(client.phone, input.audioUrl);
      }
      return adapter.sendText(client.phone, personalizedMessage);
    }),

  getConnectionStatus: protectedProcedure.query(async ({ ctx }) => {
    const isN2Available = ctx.tenant.plan === 'PRO' && Boolean(process.env.WHATSAPP_API_TOKEN);
    return { connected: isN2Available, plan: ctx.tenant.plan };
  }),
});
