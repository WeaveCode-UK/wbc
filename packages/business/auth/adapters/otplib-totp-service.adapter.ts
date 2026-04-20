import { authenticator } from "otplib";
import type { TotpService } from "../ports/totp-service.port";

/**
 * `otplib`-backed TOTP implementation. Uses default RFC 6238 parameters
 * (SHA-1, 30s step, 6 digits) and a ±1 step verification window to tolerate
 * small clock skew between server and authenticator app.
 */
export class OtplibTotpService implements TotpService {
  constructor() {
    authenticator.options = { window: 1, step: 30, digits: 6 };
  }

  generateSecret(): string {
    return authenticator.generateSecret();
  }

  buildOtpauthUri(input: {
    accountEmail: string;
    issuer: string;
    secret: string;
  }): string {
    return authenticator.keyuri(input.accountEmail, input.issuer, input.secret);
  }

  verify(input: { token: string; secret: string }): boolean {
    try {
      return authenticator.check(input.token, input.secret);
    } catch {
      return false;
    }
  }
}
