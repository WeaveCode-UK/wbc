import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const uuidSchema = z.string().uuid();

export const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number (E.164)');

export const dateRangeSchema = z.object({
  from: z.date(),
  to: z.date(),
}).refine((data) => data.to >= data.from, { message: 'End date must be after start date' });
