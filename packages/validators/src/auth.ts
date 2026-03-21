import { z } from 'zod';
import { phoneSchema } from './common';

export const sendOtpSchema = z.object({ phone: phoneSchema });
export const registerSchema = z.object({ name: z.string().min(2).max(100), phone: phoneSchema });
