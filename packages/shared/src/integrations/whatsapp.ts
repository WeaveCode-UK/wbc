import { z } from "zod";

// ACH-019 apis-integracoes: validate the shape Meta returns before
// indexing into it. Lives in @wbc/shared (not the adapter) because
// business/* has no package.json and therefore no declared zod dep;
// shared already does.
export const WhatsAppSendResponseSchema = z
  .object({
    messages: z.array(z.object({ id: z.string() }).passthrough()).min(1),
  })
  .passthrough();

export type WhatsAppSendResponse = z.infer<typeof WhatsAppSendResponseSchema>;
