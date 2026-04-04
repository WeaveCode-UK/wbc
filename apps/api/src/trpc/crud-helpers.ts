import { z } from 'zod';
import { protectedProcedure } from './trpc';
import { paginationSchema, uuidSchema } from '@wbc/validators';

export function createGetByIdProcedure<T>(
  handler: (tenantId: string, id: string) => Promise<T>,
) {
  return protectedProcedure
    .input(z.object({ id: uuidSchema }))
    .query(async ({ ctx, input }) => {
      return handler(ctx.tenant.tenantId, input.id);
    });
}

export function createDeleteProcedure(
  handler: (tenantId: string, id: string) => Promise<void>,
) {
  return protectedProcedure
    .input(z.object({ id: uuidSchema }))
    .mutation(async ({ ctx, input }) => {
      await handler(ctx.tenant.tenantId, input.id);
      return { success: true };
    });
}
