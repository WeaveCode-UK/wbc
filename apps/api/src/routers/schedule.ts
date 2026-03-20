import { z } from 'zod';
import { router, protectedProcedure } from '../trpc/trpc';
import { listAppointments, createAppointment, updateAppointment, deleteAppointment, listReminders, dismissReminder, getUpcomingBirthdays, getMyDay, getCalendar } from '../../../../packages/business/schedule/use-cases/manage-appointments';
import { uuidSchema } from '@wbc/validators';

export const scheduleRouter = router({
  getMyDay: protectedProcedure.query(async ({ ctx }) => {
    return getMyDay(ctx.tenant.tenantId);
  }),

  getCalendar: protectedProcedure
    .input(z.object({ month: z.number().int().min(1).max(12), year: z.number().int() }))
    .query(async ({ ctx, input }) => {
      return getCalendar(ctx.tenant.tenantId, input.month, input.year);
    }),

  listAppointments: protectedProcedure
    .input(z.object({ from: z.date().optional(), to: z.date().optional() }))
    .query(async ({ ctx, input }) => {
      const dateRange = input.from && input.to ? { from: input.from, to: input.to } : undefined;
      return listAppointments(ctx.tenant.tenantId, dateRange);
    }),

  createAppointment: protectedProcedure
    .input(z.object({ title: z.string().min(1), type: z.enum(['VISIT', 'DEMO', 'BEAUTY_DAY', 'DELIVERY', 'OTHER']), clientId: z.string().uuid().optional(), address: z.string().optional(), notes: z.string().optional(), startsAt: z.date(), endsAt: z.date().optional() }))
    .mutation(async ({ ctx, input }) => {
      return createAppointment(ctx.tenant.tenantId, input);
    }),

  updateAppointment: protectedProcedure
    .input(z.object({ id: uuidSchema, title: z.string().optional(), notes: z.string().optional(), startsAt: z.date().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return updateAppointment(ctx.tenant.tenantId, id, data);
    }),

  deleteAppointment: protectedProcedure
    .input(z.object({ id: uuidSchema }))
    .mutation(async ({ ctx, input }) => {
      await deleteAppointment(ctx.tenant.tenantId, input.id);
      return { success: true };
    }),

  listReminders: protectedProcedure
    .input(z.object({ status: z.string().optional(), type: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return listReminders(ctx.tenant.tenantId, input.status, input.type);
    }),

  dismissReminder: protectedProcedure
    .input(z.object({ id: uuidSchema }))
    .mutation(async ({ ctx, input }) => {
      return dismissReminder(ctx.tenant.tenantId, input.id);
    }),

  getUpcomingBirthdays: protectedProcedure
    .input(z.object({ days: z.number().int().min(1).max(90).default(30) }))
    .query(async ({ ctx, input }) => {
      return getUpcomingBirthdays(ctx.tenant.tenantId, input.days);
    }),
});
