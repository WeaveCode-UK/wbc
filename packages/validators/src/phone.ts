import {
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";
import { z } from "zod";

const DEFAULT_COUNTRY: CountryCode = "BR";

/**
 * Parses a user-supplied phone number and returns it in E.164 form (e.g.
 * "+5511999990000"). Rejects strings that `libphonenumber-js` classifies as
 * invalid for the target country, which catches filler like "0000000000"
 * and anything that fails the country-specific rules (ACH-028).
 */
export function parseAndFormatPhone(
  raw: string,
  country: CountryCode = DEFAULT_COUNTRY,
): string | null {
  const parsed = parsePhoneNumberFromString(raw, country);
  if (!parsed || !parsed.isValid()) return null;
  return parsed.number; // already E.164
}

/**
 * Zod transform that validates a phone number and rewrites it to E.164.
 * Use in place of `z.string().min(10).max(15)` for phone fields.
 */
export const phoneE164Schema = z
  .string()
  .trim()
  .transform((val, ctx) => {
    const formatted = parseAndFormatPhone(val);
    if (!formatted) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Número de telefone inválido",
      });
      return z.NEVER;
    }
    return formatted;
  });

/**
 * Optional variant that accepts undefined/null but rejects invalid strings.
 */
export const optionalPhoneE164Schema = z
  .string()
  .trim()
  .optional()
  .transform((val, ctx) => {
    if (val === undefined || val === "") return undefined;
    const formatted = parseAndFormatPhone(val);
    if (!formatted) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Número de telefone inválido",
      });
      return z.NEVER;
    }
    return formatted;
  });
