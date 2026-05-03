import { describe, it, expect } from "vitest";
import {
  OtpExpiredError,
  OtpInvalidError,
  OtpAlreadyUsedError,
  TenantNotFoundError,
  PhoneAlreadyRegisteredError,
  OtpTooManyAttemptsError,
  OtpSendRateLimitError,
} from "../errors";

// Auth domain errors. We assert each error class:
// (1) extends native Error so try/catch + instanceof bridges work,
// (2) has the exact `name` consumers (logger, tRPC mapper) match on.

describe("OtpExpiredError", () => {
  it("has the expected name and extends Error", () => {
    const e = new OtpExpiredError();
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("OtpExpiredError");
    expect(e.message).toBe("OTP code has expired");
  });
});

describe("OtpInvalidError", () => {
  it("has the expected name and extends Error", () => {
    const e = new OtpInvalidError();
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("OtpInvalidError");
    expect(e.message).toBe("Invalid OTP code");
  });
});

describe("OtpAlreadyUsedError", () => {
  it("has the expected name and extends Error", () => {
    const e = new OtpAlreadyUsedError();
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("OtpAlreadyUsedError");
    expect(e.message).toBe("OTP code has already been used");
  });
});

describe("TenantNotFoundError", () => {
  it("has the expected name and extends Error", () => {
    const e = new TenantNotFoundError();
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("TenantNotFoundError");
    expect(e.message).toBe("Tenant not found");
  });
});

describe("PhoneAlreadyRegisteredError", () => {
  it("has the expected name and extends Error", () => {
    const e = new PhoneAlreadyRegisteredError();
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("PhoneAlreadyRegisteredError");
    expect(e.message).toBe("Phone number is already registered");
  });
});

describe("OtpTooManyAttemptsError", () => {
  it("has the expected name and explains the lockout window", () => {
    const e = new OtpTooManyAttemptsError();
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("OtpTooManyAttemptsError");
    // Message must surface the wait window because UI shows it verbatim.
    expect(e.message).toContain("15 minutes");
  });
});

describe("OtpSendRateLimitError", () => {
  it("has the expected name and extends Error", () => {
    const e = new OtpSendRateLimitError();
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("OtpSendRateLimitError");
    expect(e.message).toContain("Too many OTP requests");
  });
});
