import { z } from "zod";

// ACH-018 apis-integracoes: cap `page` and the effective offset
// (`page * limit`). Without this, a request with `page: 1_000_000` forces
// Postgres into a massive OFFSET scan, turning every paginated list into
// a cheap DoS vector. 1000 pages × 100 limit = 100 000 rows which is
// already beyond any real UI need; anything past that should use cursor-
// based pagination instead.
export const MAX_PAGE = 1000;
export const MAX_EFFECTIVE_OFFSET = 100_000;

export const paginationSchema = z
  .object({
    page: z.number().int().min(1).max(MAX_PAGE).default(1),
    limit: z.number().int().min(1).max(100).default(20),
  })
  .refine((v) => v.page * v.limit <= MAX_EFFECTIVE_OFFSET, {
    message: `page × limit must not exceed ${MAX_EFFECTIVE_OFFSET}. Use cursor-based pagination for deeper scans.`,
    path: ["page"],
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
