import { z } from 'zod';
import { router, protectedProcedure } from '../trpc/trpc';
import { getTeam, addMember, removeMember, listTasks, createTask, approveTask, getTeamRanking } from '../../../../packages/business/team/use-cases/manage-team';
import { uuidSchema } from '@wbc/validators';

export const teamRouter = router({
  getTeam: protectedProcedure.query(async ({ ctx }) => {
    return getTeam(ctx.tenant.tenantId);
  }),
  addMember: protectedProcedure
    .input(z.object({ phone: z.string() }))
    .mutation(async ({ ctx, input }) => { return addMember(ctx.tenant.tenantId, input.phone); }),
  removeMember: protectedProcedure
    .input(z.object({ memberId: z.string() }))
    .mutation(async ({ ctx, input }) => { await removeMember(ctx.tenant.tenantId, input.memberId); return { success: true }; }),
  listTasks: protectedProcedure
    .input(z.object({ status: z.string().optional() }))
    .query(async ({ ctx, input }) => { return listTasks(ctx.tenant.tenantId, input.status); }),
  createTask: protectedProcedure
    .input(z.object({ memberId: z.string(), description: z.string(), message: z.string().optional(), scheduledAt: z.date().optional() }))
    .mutation(async ({ ctx, input }) => { return createTask(ctx.tenant.tenantId, input.memberId, input.description, input.message, input.scheduledAt); }),
  approveTask: protectedProcedure
    .input(z.object({ taskId: uuidSchema }))
    .mutation(async ({ ctx, input }) => { return approveTask(ctx.tenant.tenantId, input.taskId); }),
  getRanking: protectedProcedure.query(async ({ ctx }) => { return getTeamRanking(ctx.tenant.tenantId); }),
});
