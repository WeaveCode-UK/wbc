import { z } from 'zod';
import { paginationSchema, uuidSchema } from './common';

export const listClientsSchema = paginationSchema.extend({
  search: z.string().optional(),
  classification: z.enum(['A', 'B', 'C']).optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  isLead: z.boolean().optional(),
});

export const getClientByIdSchema = z.object({ id: uuidSchema });

export const createClientSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().min(8).max(20),
  email: z.string().email().optional(),
  sex: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  birthday: z.date().optional(),
  profession: z.string().optional(),
  skinType: z.enum(['OILY', 'DRY', 'COMBINATION', 'NORMAL', 'SENSITIVE']).optional(),
  hairType: z.enum(['STRAIGHT', 'WAVY', 'CURLY', 'COILY']).optional(),
  allergies: z.string().optional(),
  makeupTones: z.string().optional(),
  preferences: z.string().optional(),
  notes: z.string().optional(),
  source: z.enum(['MANUAL', 'QRCODE', 'IMPORT', 'AUTOCADASTRO', 'WHATSAPP', 'SPREADSHEET', 'REFERRAL']).optional(),
  isLead: z.boolean().optional(),
});

export const updateClientSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1).max(200).optional(),
  phone: z.string().min(8).max(20).optional(),
  email: z.string().email().nullable().optional(),
  notes: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const deleteClientSchema = z.object({ id: uuidSchema });
export const createTagSchema = z.object({ name: z.string().min(1), color: z.string().optional(), autoRule: z.string().optional() });
export const deleteTagSchema = z.object({ id: uuidSchema });
export const tagClientSchema = z.object({ clientId: uuidSchema, tagId: uuidSchema });
export const untagClientSchema = z.object({ clientId: uuidSchema, tagId: uuidSchema });
export const bulkTagSchema = z.object({ clientIds: z.array(uuidSchema), tagId: uuidSchema });
export const convertToClientSchema = z.object({ clientId: uuidSchema });
