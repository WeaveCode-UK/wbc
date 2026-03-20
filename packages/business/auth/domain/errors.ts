export class OtpExpiredError extends Error {
  constructor() {
    super('OTP code has expired');
    this.name = 'OtpExpiredError';
  }
}

export class OtpInvalidError extends Error {
  constructor() {
    super('Invalid OTP code');
    this.name = 'OtpInvalidError';
  }
}

export class OtpAlreadyUsedError extends Error {
  constructor() {
    super('OTP code has already been used');
    this.name = 'OtpAlreadyUsedError';
  }
}

export class TenantNotFoundError extends Error {
  constructor() {
    super('Tenant not found');
    this.name = 'TenantNotFoundError';
  }
}

export class PhoneAlreadyRegisteredError extends Error {
  constructor() {
    super('Phone number is already registered');
    this.name = 'PhoneAlreadyRegisteredError';
  }
}
