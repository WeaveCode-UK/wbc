import type { TotpService } from "../ports/totp-service.port";
import { encryptTotpSecret } from "../adapters/totp-secret-crypto";
import { prisma } from "@wbc/db";
import { createHash, randomBytes } from "crypto";

export interface EnableTotpBeginOutput {
  /** Base32 secret — show once to the user in case QR scan fails. */
  secret: string;
  /** otpauth:// URI to encode as QR. */
  otpauthUri: string;
}

export interface ConfirmTotpInput {
  accountId: string;
  secret: string; // the secret the user just set up (still unencrypted here)
  token: string; // 6-digit code to confirm setup
}

export interface ConfirmTotpOutput {
  /** Plain one-shot recovery codes — shown once to the user. */
  recoveryCodes: string[];
}

const ISSUER = "WBC";
const RECOVERY_CODE_COUNT = 10;

function generateRecoveryCode(): string {
  // 10 bytes of entropy → 20 hex chars, grouped XXXX-XXXX-XXXX-XXXX-XXXX.
  const hex = randomBytes(10).toString("hex").toUpperCase();
  return hex.match(/.{4}/g)!.join("-");
}

function hashRecoveryCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

/**
 * Step 1 — generate a secret and provisioning URI. The secret is returned to
 * the caller *without* being persisted; nothing is stored until the user
 * proves possession via `ConfirmTotp` (step 2).
 */
export class BeginTotpEnrollment {
  constructor(private readonly totp: TotpService) {}

  execute(input: { accountEmail: string }): EnableTotpBeginOutput {
    const secret = this.totp.generateSecret();
    const otpauthUri = this.totp.buildOtpauthUri({
      accountEmail: input.accountEmail,
      issuer: ISSUER,
      secret,
    });
    return { secret, otpauthUri };
  }
}

/**
 * Step 2 — user types the 6-digit code from the authenticator app. If valid,
 * the secret is encrypted and stored, TOTP is marked enabled, and a fresh
 * batch of recovery codes is generated.
 */
export class ConfirmTotpEnrollment {
  constructor(private readonly totp: TotpService) {}

  async execute(input: ConfirmTotpInput): Promise<ConfirmTotpOutput> {
    if (!this.totp.verify({ token: input.token, secret: input.secret })) {
      throw new Error("Invalid TOTP code — enrollment aborted");
    }

    const codes = Array.from(
      { length: RECOVERY_CODE_COUNT },
      generateRecoveryCode,
    );
    const hashed = codes.map(hashRecoveryCode);

    await prisma.account.update({
      where: { id: input.accountId },
      data: {
        totpSecret: encryptTotpSecret(input.secret),
        totpEnabled: true,
        totpActivatedAt: new Date(),
        totpRecoveryCodes: hashed,
      },
    });

    return { recoveryCodes: codes };
  }
}
