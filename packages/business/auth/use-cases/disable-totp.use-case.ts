import type { TotpService } from "../ports/totp-service.port";
import { decryptTotpSecret } from "../adapters/totp-secret-crypto";
import { prisma } from "@wbc/db";

/**
 * Disables TOTP on an account. Requires a valid current TOTP code so a
 * compromised session cookie can't turn off MFA unilaterally.
 */
export class DisableTotp {
  constructor(private readonly totp: TotpService) {}

  async execute(input: {
    accountId: string;
    currentToken: string;
  }): Promise<void> {
    const account = await prisma.account.findUnique({
      where: { id: input.accountId },
      select: { totpEnabled: true, totpSecret: true },
    });
    if (!account || !account.totpEnabled || !account.totpSecret) {
      throw new Error("TOTP is not enabled for this account");
    }

    const secret = decryptTotpSecret(account.totpSecret);
    if (!this.totp.verify({ token: input.currentToken, secret })) {
      throw new Error("Invalid TOTP code");
    }

    await prisma.account.update({
      where: { id: input.accountId },
      data: {
        totpSecret: null,
        totpEnabled: false,
        totpActivatedAt: null,
        totpRecoveryCodes: [],
      },
    });
  }
}
