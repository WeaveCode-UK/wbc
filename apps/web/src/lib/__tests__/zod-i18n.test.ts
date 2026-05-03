// Coverage push — zod-i18n error map. Routes Zod validation issues to
// next-intl translation keys so form errors honor the user's locale.
// We assert the routing table without coupling to the actual translation
// strings (the translator is a stub that echoes its input).
import { describe, it, expect } from "vitest";
import { z } from "zod";
import { zodI18nErrorMap } from "../zod-i18n";

const t = (key: string, values?: Record<string, string | number>): string =>
  values ? `${key} ${JSON.stringify(values)}` : key;

const map = zodI18nErrorMap(t);

function issueFromParse<T>(schema: z.ZodSchema<T>, input: unknown): z.ZodIssue {
  const r = schema.safeParse(input);
  if (r.success) throw new Error("expected parse to fail");
  return r.error.issues[0]!;
}

describe("zodI18nErrorMap", () => {
  it("invalid_type undefined → validation.required", () => {
    const issue = issueFromParse(z.object({ x: z.string() }), {});
    const out = map(issue, { defaultError: "x", data: undefined });
    expect(out.message).toContain("validation.required");
  });

  it("invalid_type non-undefined → validation.unknown", () => {
    const issue = issueFromParse(z.string(), 42);
    const out = map(issue, { defaultError: "x", data: 42 });
    expect(out.message).toContain("validation.unknown");
  });

  it("invalid_string email → validation.invalid_email", () => {
    const issue = issueFromParse(z.string().email(), "not-an-email");
    const out = map(issue, { defaultError: "x", data: "not-an-email" });
    expect(out.message).toContain("validation.invalid_email");
  });

  it("invalid_string url → validation.invalid_url", () => {
    const issue = issueFromParse(z.string().url(), "no");
    const out = map(issue, { defaultError: "x", data: "no" });
    expect(out.message).toContain("validation.invalid_url");
  });

  it("invalid_string uuid → validation.invalid_uuid", () => {
    const issue = issueFromParse(z.string().uuid(), "x");
    const out = map(issue, { defaultError: "x", data: "x" });
    expect(out.message).toContain("validation.invalid_uuid");
  });

  it("invalid_string regex → validation.regex_mismatch", () => {
    const issue = issueFromParse(z.string().regex(/^[a-z]+$/), "ABC");
    const out = map(issue, { defaultError: "x", data: "ABC" });
    expect(out.message).toContain("validation.regex_mismatch");
  });

  it("too_small string → validation.too_small_string with minimum value", () => {
    const issue = issueFromParse(z.string().min(5), "no");
    const out = map(issue, { defaultError: "x", data: "no" });
    expect(out.message).toContain("validation.too_small_string");
    expect(out.message).toContain("5");
  });

  it("too_small number → validation.too_small_number", () => {
    const issue = issueFromParse(z.number().min(10), 1);
    const out = map(issue, { defaultError: "x", data: 1 });
    expect(out.message).toContain("validation.too_small_number");
    expect(out.message).toContain("10");
  });

  it("too_big string → validation.too_big_string", () => {
    const issue = issueFromParse(z.string().max(3), "abcdef");
    const out = map(issue, { defaultError: "x", data: "abcdef" });
    expect(out.message).toContain("validation.too_big_string");
    expect(out.message).toContain("3");
  });

  it("too_big number → validation.too_big_number", () => {
    const issue = issueFromParse(z.number().max(100), 200);
    const out = map(issue, { defaultError: "x", data: 200 });
    expect(out.message).toContain("validation.too_big_number");
    expect(out.message).toContain("100");
  });

  it("invalid_date → validation.invalid_date", () => {
    const issue = issueFromParse(z.date(), new Date("invalid"));
    const out = map(issue, { defaultError: "x", data: new Date("invalid") });
    expect(out.message).toContain("validation.invalid_date");
  });

  it("falls back to ctx.defaultError when issue code unhandled", () => {
    // Build a synthetic issue with a code we don't route.
    const synthetic: z.ZodIssue = {
      code: z.ZodIssueCode.custom,
      message: "x",
      path: [],
    };
    const out = map(synthetic, { defaultError: "DEFAULT-FALLBACK", data: 0 });
    expect(out.message).toBe("DEFAULT-FALLBACK");
  });
});
