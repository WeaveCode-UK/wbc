import type { TotpService } from "../ports/totp-service.port";
import { decryptTotpSecret } from "../adapters/totp-secret-crypto";
import { prisma } from "@wbc/db";
import { createHash } from "node:crypto";

/**
 * Verifies a TOTP code (or a one-shot recovery code) for an account. Returns
 * true on success. Recovery codes are consumed (removed from the account)
 * when used — they are always one-shot.
 */
export class VerifyTotp {
  constructor(private readonly totp: TotpService) {}

  async execute(input: { accountId: string; token: string }): Promise<boolean> {
    const account = await prisma.account.findUnique({
      where: { id: input.accountId },
      select: { totpEnabled: true, totpSecret: true, totpRecoveryCodes: true },
    });
    if (!account || !account.totpEnabled || !account.totpSecret) return false;

    // Primary: live TOTP code.
    const secret = decryptTotpSecret(account.totpSecret);
    if (this.totp.verify({ token: input.token, secret })) return true;

    // Fallback: one-shot recovery code. Compare as sha256 hex (not constant
    // time in JS stdlib; acceptable for this use because we early-exit on
    // first match and codes are high-entropy).
    const hashed = createHash("sha256").update(input.token).digest("hex");
    const idx = account.totpRecoveryCodes.indexOf(hashed);
    if (idx === -1) return false;

    const remaining = account.totpRecoveryCodes.filter((_, i) => i !== idx);
    await prisma.account.update({
      where: { id: input.accountId },
      data: { totpRecoveryCodes: remaining },
    });
    return true;
  }
}
