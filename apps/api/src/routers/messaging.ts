import { z } from 'zod';
import { router, protectedProcedure } from '../trpc/trpc';
import { WhatsAppN1Adapter } from '../../../../packages/business/messaging/adapters/whatsapp-n1-adapter';
import { personalizeMessage } from '../../../../packages/business/messaging/domain/whatsapp';
import { prisma } from '@wbc/db';
import { uuidSchema } from '@wbc/validators';

const whatsappN1 = new WhatsAppN1Adapter();

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
        return { success: false, whatsappLink: null };
      }

      const personalizedMessage = personalizeMessage(input.message, client.name);
      const result = await whatsappN1.sendText(client.phone, personalizedMessage);
      return result;
    }),

  getConnectionStatus: protectedProcedure.query(async ({ ctx }) => {
    return { connected: false, plan: ctx.tenant.plan };
  }),
});
