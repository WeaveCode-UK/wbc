import { z } from "zod";
import { uuidSchema } from "./common";

export const sendToClientSchema = z.object({
  // ACH-001 apis-integracoes: optional idempotencyKey on the wire.
  idempotencyKey: z.string().min(1).optional(),
  clientId: uuidSchema,
  message: z.string().min(1),
  audioUrl: z.string().optional(),
});
