import { z } from "zod";

// ACH-018 apis-integracoes: cap `page` and `limit` so a request with
// `page: 1_000_000` can't force Postgres into a massive OFFSET scan.
// Max page (1000) × max limit (100) = 100 000 rows — already beyond any
// real UI need; anything past that should use cursor-based pagination.
//
// Kept as a plain `ZodObject` (not `.refine()`-wrapped) so downstream
// schemas can `.extend()` it — `ZodEffects` doesn't expose `.extend`.
// The max() bounds alone enforce the combined cap without needing a
// cross-field refinement.
export const MAX_PAGE = 1000;
export const MAX_PAGE_LIMIT = 100;
export const MAX_EFFECTIVE_OFFSET = MAX_PAGE * MAX_PAGE_LIMIT;

export const paginationSchema = z.object({
  page: z.number().int().min(1).max(MAX_PAGE).default(1),
  limit: z.number().int().min(1).max(MAX_PAGE_LIMIT).default(20),
});

export const uuidSchema = z.string().uuid();

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number (E.164)");

export const dateRangeSchema = z
  .object({
    from: z.date(),
    to: z.date(),
  })
  .refine((data) => data.to >= data.from, {
    message: "End date must be after start date",
  });

// ACH-001 apis-integracoes: every mutation that creates/confirms/sends/
// marks state should accept an idempotency key on the wire. The API
// middleware derives a deterministic key from the input hash when the
// client omits it (compatibility during rollout), so this field stays
// optional at the validator level but the router path is guarded.
export const idempotencyKeySchema = z.string().min(1);
