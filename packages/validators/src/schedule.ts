import { z } from 'zod';
import { uuidSchema } from './common';

export const getCalendarSchema = z.object({ month: z.number().int().min(1).max(12), year: z.number().int() });
export const listAppointmentsSchema = z.object({ from: z.date().optional(), to: z.date().optional() });
export const createAppointmentSchema = z.object({ title: z.string().min(1), type: z.enum(['VISIT', 'DEMO', 'BEAUTY_DAY', 'DELIVERY', 'OTHER']), clientId: z.string().uuid().optional(), address: z.string().optional(), notes: z.string().optional(), startsAt: z.date(), endsAt: z.date().optional() });
export const updateAppointmentSchema = z.object({ id: uuidSchema, title: z.string().optional(), notes: z.string().optional(), startsAt: z.date().optional() });
export const deleteAppointmentSchema = z.object({ id: uuidSchema });
export const listRemindersSchema = z.object({ status: z.string().optional(), type: z.string().optional() });
export const dismissReminderSchema = z.object({ id: uuidSchema });
export const getUpcomingBirthdaysSchema = z.object({ days: z.number().int().min(1).max(90).default(30) });
