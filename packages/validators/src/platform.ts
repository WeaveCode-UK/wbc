import { z } from 'zod';

export const completeStepSchema = z.object({ stepId: z.string() });
