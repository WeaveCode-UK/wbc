// ACH-005 seed: Zod error-map that routes to the `errors.validation.*`
// namespace so form errors honor next-intl locale. Callers wire it once
// via `z.setErrorMap(zodI18nErrorMap(t))` in a client layout.
//
// Currently wired in auth flows; other domains should adopt it incrementally.
// Follow-up: docs/UI-I18N-FOLLOWUP.md lists the remaining migration targets.

import { z, type ZodErrorMap, type ZodIssueOptionalMessage } from "zod";

type Translator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

export function zodI18nErrorMap(t: Translator): ZodErrorMap {
  return (issue: ZodIssueOptionalMessage, ctx) => {
    switch (issue.code) {
      case z.ZodIssueCode.invalid_type:
        if (issue.received === "undefined" || issue.received === "null") {
          return { message: t("validation.required") };
        }
        return { message: t("validation.unknown") };
      case z.ZodIssueCode.invalid_string:
        if (issue.validation === "email") {
          return { message: t("validation.invalid_email") };
        }
        if (issue.validation === "url") {
          return { message: t("validation.invalid_url") };
        }
        if (issue.validation === "uuid") {
          return { message: t("validation.invalid_uuid") };
        }
        if (issue.validation === "regex") {
          return { message: t("validation.regex_mismatch") };
        }
        return { message: t("validation.unknown") };
      case z.ZodIssueCode.too_small:
        if (issue.type === "string") {
          return {
            message: t("validation.too_small_string", {
              minimum: Number(issue.minimum),
            }),
          };
        }
        return {
          message: t("validation.too_small_number", {
            minimum: Number(issue.minimum),
          }),
        };
      case z.ZodIssueCode.too_big:
        if (issue.type === "string") {
          return {
            message: t("validation.too_big_string", {
              maximum: Number(issue.maximum),
            }),
          };
        }
        return {
          message: t("validation.too_big_number", {
            maximum: Number(issue.maximum),
          }),
        };
      case z.ZodIssueCode.invalid_date:
        return { message: t("validation.invalid_date") };
      default:
        return { message: ctx.defaultError };
    }
  };
}

export function installZodI18n(t: Translator): void {
  z.setErrorMap(zodI18nErrorMap(t));
}
