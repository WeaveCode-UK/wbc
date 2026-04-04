import { TRPCError } from '@trpc/server';

const NOT_FOUND_ERRORS = [
  'ClientNotFoundError',
  'ProductNotFoundError',
  'BrandNotFoundError',
  'ShowcaseNotFoundError',
  'SaleNotFoundError',
  'PaymentNotFoundError',
  'StockNotFoundError',
  'OrderNotFoundError',
  'CampaignNotFoundError',
  'ExpenseNotFoundError',
  'AppointmentNotFoundError',
  'ReminderNotFoundError',
  'TeamNotFoundError',
  'TeamMemberNotFoundError',
  'TeamTaskNotFoundError',
  'DeliveryNotFoundError',
  'LandingPageNotFoundError',
  'TenantNotFoundError',
  'TagNotFoundError',
];

const BAD_REQUEST_ERRORS = [
  'OtpExpiredError',
  'OtpInvalidError',
  'OtpAlreadyUsedError',
  'InvalidSaleStatusError',
  'InvalidCampaignStatusError',
  'InvalidStatusTransitionError',
  'InvalidClientDataError',
  'InsufficientStockError',
  'InsufficientCashbackError',
  'MessageSendFailedError',
  'WhatsAppNotConnectedError',
];

const CONFLICT_ERRORS = [
  'DuplicatePhoneError',
  'DuplicateTagError',
  'DuplicateTeamMemberError',
  'PhoneAlreadyRegisteredError',
  'SlugAlreadyTakenError',
];

const TOO_MANY_REQUESTS_ERRORS = [
  'OtpTooManyAttemptsError',
  'OtpSendRateLimitError',
];

export function mapDomainErrorToTRPC(error: unknown): TRPCError | null {
  if (!(error instanceof Error)) return null;

  const name = error.constructor.name;

  if (NOT_FOUND_ERRORS.includes(name)) {
    return new TRPCError({ code: 'NOT_FOUND', message: error.message, cause: error });
  }

  if (BAD_REQUEST_ERRORS.includes(name)) {
    return new TRPCError({ code: 'BAD_REQUEST', message: error.message, cause: error });
  }

  if (CONFLICT_ERRORS.includes(name)) {
    return new TRPCError({ code: 'CONFLICT', message: error.message, cause: error });
  }

  if (TOO_MANY_REQUESTS_ERRORS.includes(name)) {
    return new TRPCError({ code: 'TOO_MANY_REQUESTS', message: error.message, cause: error });
  }

  return null;
}
