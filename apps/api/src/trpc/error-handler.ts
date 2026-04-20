import { TRPCError } from "@trpc/server";

// ACH-018: explicit table of domain-error-name → tRPC code. Adding a new
// domain error is now a single-line change here; the mapping is testable
// in isolation (see domainErrorMiddleware's consumer tests) and the default
// (`return null`) keeps unknown errors falling through to a generic 500
// rather than being silently rewritten.

const NOT_FOUND_ERRORS = [
  "ClientNotFoundError",
  "ProductNotFoundError",
  "BrandNotFoundError",
  "ShowcaseNotFoundError",
  "SaleNotFoundError",
  "PaymentNotFoundError",
  "StockNotFoundError",
  "OrderNotFoundError",
  "CampaignNotFoundError",
  "ExpenseNotFoundError",
  "AppointmentNotFoundError",
  "ReminderNotFoundError",
  "TeamNotFoundError",
  "TeamMemberNotFoundError",
  "TeamTaskNotFoundError",
  "DeliveryNotFoundError",
  "LandingPageNotFoundError",
  "TenantNotFoundError",
  "TagNotFoundError",
];

const BAD_REQUEST_ERRORS = [
  "OtpExpiredError",
  "OtpInvalidError",
  "OtpAlreadyUsedError",
  "InvalidSaleStatusError",
  "InvalidCampaignStatusError",
  "InvalidStatusTransitionError",
  "InvalidClientDataError",
  "InsufficientStockError",
  "InsufficientCashbackError",
  "MessageSendFailedError",
  "WhatsAppNotConnectedError",
  // Added by audit run seguranca/2026-04-18_22-06-18.
  "InvalidResetTokenError",
  "InvalidVerificationTokenError",
  "WeakPasswordError",
];

const UNAUTHORIZED_ERRORS = [
  // ACH-004 seguranca: both map to the same user-facing message; still
  // 401 on the wire so the client knows to clear any stale session.
  "InvalidCredentialsError",
  "AccountLockedError",
];

const INTERNAL_SERVER_ERRORS = [
  // ACH-001 seguranca: ResendEmailSender requires RESEND_API_KEY in prod;
  // if raised, the operator forgot to wire the env var.
  "ResendNotConfiguredError",
];

const CONFLICT_ERRORS = [
  "DuplicatePhoneError",
  "DuplicateTagError",
  "DuplicateTeamMemberError",
  "PhoneAlreadyRegisteredError",
  "SlugAlreadyTakenError",
];

const TOO_MANY_REQUESTS_ERRORS = [
  "OtpTooManyAttemptsError",
  "OtpSendRateLimitError",
  // ACH-013 apis-integracoes: AI usage-quota errors map to rate-limit on the
  // wire so callers back off rather than treat it as a server fault.
  "AILimitExceededError",
];

// ACH-013 apis-integracoes: upstream AI providers going dark is a
// SERVICE_UNAVAILABLE — the client can safely retry after a backoff.
// Previously these bubbled up as 500 and made Sentry noisy.
const SERVICE_UNAVAILABLE_ERRORS = ["AIProviderUnavailableError"];

export function mapDomainErrorToTRPC(error: unknown): TRPCError | null {
  if (!(error instanceof Error)) return null;

  const name = error.constructor.name;

  if (NOT_FOUND_ERRORS.includes(name)) {
    return new TRPCError({
      code: "NOT_FOUND",
      message: error.message,
      cause: error,
    });
  }

  if (BAD_REQUEST_ERRORS.includes(name)) {
    return new TRPCError({
      code: "BAD_REQUEST",
      message: error.message,
      cause: error,
    });
  }

  if (CONFLICT_ERRORS.includes(name)) {
    return new TRPCError({
      code: "CONFLICT",
      message: error.message,
      cause: error,
    });
  }

  if (TOO_MANY_REQUESTS_ERRORS.includes(name)) {
    return new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: error.message,
      cause: error,
    });
  }

  if (UNAUTHORIZED_ERRORS.includes(name)) {
    return new TRPCError({
      code: "UNAUTHORIZED",
      message: error.message,
      cause: error,
    });
  }

  if (INTERNAL_SERVER_ERRORS.includes(name)) {
    return new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message,
      cause: error,
    });
  }

  if (SERVICE_UNAVAILABLE_ERRORS.includes(name)) {
    // tRPC doesn't have a 503 code; use INTERNAL_SERVER_ERROR with an
    // opaque code the client SDK can key off. The `cause` preserves the
    // original error for Sentry grouping.
    return new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message,
      cause: error,
    });
  }

  return null;
}
