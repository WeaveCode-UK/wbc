import { z } from 'zod';
import { uuidSchema } from './common';

export const sendToClientSchema = z.object({ clientId: uuidSchema, message: z.string().min(1), audioUrl: z.string().optional() });
