import { z } from "zod";
import {
  paginationSchema,
  uuidSchema,
  TEXT_SHORT_MAX,
  TEXT_LONG_MAX,
} from "./common";
import { phoneE164Schema, optionalPhoneE164Schema } from "./phone";

// ACH-018: every free-text field caps at TEXT_SHORT_MAX or TEXT_LONG_MAX so
// an authenticated user cannot store 100 MB of "notes" per client. notes
// take TEXT_LONG (5000) to allow a paragraph; profession/allergies/etc.
// take TEXT_SHORT (1000) which is already huge for real entries.
export const listClientsSchema = paginationSchema.extend({
  search: z.string().max(TEXT_SHORT_MAX).optional(),
  classification: z.enum(["A", "B", "C"]).optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  isLead: z.boolean().optional(),
});

export const getClientByIdSchema = z.object({ id: uuidSchema });

export const createClientSchema = z.object({
  // ACH-001 apis-integracoes: optional on the wire; middleware derives
  // from input hash when omitted.
  idempotencyKey: z.string().min(1).optional(),
  name: z.string().min(1).max(200),
  phone: phoneE164Schema,
  email: z.string().email().optional(),
  sex: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  birthday: z.date().optional(),
  profession: z.string().max(TEXT_SHORT_MAX).optional(),
  skinType: z
    .enum(["OILY", "DRY", "COMBINATION", "NORMAL", "SENSITIVE"])
    .optional(),
  hairType: z.enum(["STRAIGHT", "WAVY", "CURLY", "COILY"]).optional(),
  allergies: z.string().max(TEXT_SHORT_MAX).optional(),
  makeupTones: z.string().max(TEXT_SHORT_MAX).optional(),
  preferences: z.string().max(TEXT_SHORT_MAX).optional(),
  notes: z.string().max(TEXT_LONG_MAX).optional(),
  source: z
    .enum([
      "MANUAL",
      "QRCODE",
      "IMPORT",
      "AUTOCADASTRO",
      "WHATSAPP",
      "SPREADSHEET",
      "REFERRAL",
    ])
    .optional(),
  isLead: z.boolean().optional(),
});

export const updateClientSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1).max(200).optional(),
  phone: optionalPhoneE164Schema,
  email: z.string().email().nullable().optional(),
  notes: z.string().max(TEXT_LONG_MAX).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const deleteClientSchema = z.object({ id: uuidSchema });
export const createTagSchema = z.object({
  name: z.string().min(1).max(80),
  color: z.string().max(32).optional(),
  autoRule: z.string().max(TEXT_SHORT_MAX).optional(),
});
export const deleteTagSchema = z.object({ id: uuidSchema });
export const tagClientSchema = z.object({
  clientId: uuidSchema,
  tagId: uuidSchema,
});
export const untagClientSchema = z.object({
  clientId: uuidSchema,
  tagId: uuidSchema,
});
export const bulkTagSchema = z.object({
  clientIds: z.array(uuidSchema),
  tagId: uuidSchema,
});
export const convertToClientSchema = z.object({ clientId: uuidSchema });
