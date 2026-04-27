import { z } from "zod";
import { uuidSchema, TEXT_LONG_MAX, URL_MAX } from "./common";

// ACH-018: caps message body and audio URL. audioUrl uses .url() to refuse
// non-URL strings outright, plus URL_MAX so a 100 MB string can't slip
// through as "valid".
export const sendToClientSchema = z.object({
  // ACH-001 apis-integracoes: optional idempotencyKey on the wire.
  idempotencyKey: z.string().min(1).optional(),
  clientId: uuidSchema,
  message: z.string().min(1).max(TEXT_LONG_MAX),
  audioUrl: z.string().url().max(URL_MAX).optional(),
});
