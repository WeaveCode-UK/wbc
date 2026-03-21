import { z } from 'zod';
import { uuidSchema } from './common';

export const addMemberSchema = z.object({ phone: z.string() });
export const removeMemberSchema = z.object({ memberId: z.string() });
export const listTasksSchema = z.object({ status: z.string().optional() });
export const createTaskSchema = z.object({ memberId: z.string(), description: z.string(), message: z.string().optional(), scheduledAt: z.date().optional() });
export const approveTaskSchema = z.object({ taskId: uuidSchema });
