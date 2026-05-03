// T2.18 — TOTP MFA: BeginTotpEnrollment, ConfirmTotpEnrollment,
//                  VerifyTotp, DisableTotp
//
// Invariants:
//   - BeginTotp returns a fresh secret + otpauth URI but does NOT persist
//     anything (the secret only lives on the client until the user proves
//     possession via Confirm).
//   - Confirm requires a valid 6-digit code; only on success does the
//     account row get totpEnabled=true and recovery codes (HASHED, never
//     stored as plaintext) get written.
//   - The user receives plaintext recovery codes ONCE. Each code is
//     SHA-256-hashed before persistence — a DB read can never recover them.
//   - VerifyTotp accepts ±1 step (default otplib window) and rejects ±2.
//     We test this by mocking the TotpService so the use-case sees the
//     port contract honored.
//   - Recovery codes are one-shot — after a successful recovery use the
//     code is removed from the persisted set.
//   - DisableTotp requires a valid current TOTP code; an invalid one
//     leaves totpEnabled untouched.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHash } from "crypto";

const { findUniqueAccount, updateAccount } = vi.hoisted(() => ({
  findUniqueAccount: vi.fn(),
  updateAccount: vi.fn(),
}));

vi.mock("@wbc/db", () => ({
  prisma: {
    account: {
      findUnique: findUniqueAccount,
      update: updateAccount,
    },
  },
}));

// totp-secret-crypto reads TOTP_ENCRYPTION_KEY at call-time. In the
// dev fallback path it derives a deterministic key, so encrypt/decrypt
// round-trip in the test process — no extra mocking needed.
import {
  BeginTotpEnrollment,
  ConfirmTotpEnrollment,
} from "../enable-totp.use-case";
import { VerifyTotp } from "../verify-totp.use-case";
import { DisableTotp } from "../disable-totp.use-case";
import { encryptTotpSecret } from "../../adapters/totp-secret-crypto";
import type { TotpService } from "../../ports/totp-service.port";

function mockTotp(
  verifyImpl?: (i: { token: string; secret: string }) => boolean,
): TotpService {
  return {
    generateSecret: vi.fn().mockReturnValue("BASE32SECRETXYZ"),
    buildOtpauthUri: vi
      .fn()
      .mockReturnValue(
        "otpauth://totp/WBC:user@x?secret=BASE32SECRETXYZ&issuer=WBC",
      ),
    verify: vi.fn().mockImplementation(verifyImpl ?? (() => true)),
  };
}

beforeEach(() => {
  findUniqueAccount.mockReset();
  updateAccount.mockReset();
});

describe("BeginTotpEnrollment", () => {
  it("returns a fresh secret and otpauth URI without persisting anything", () => {
    const totp = mockTotp();
    const useCase = new BeginTotpEnrollment(totp);

    const out = useCase.execute({ accountEmail: "user@example.com" });

    expect(out.secret).toBe("BASE32SECRETXYZ");
    expect(out.otpauthUri).toContain("otpauth://totp/WBC:");
    // The whole point: nothing hits the DB before Confirm.
    expect(updateAccount).not.toHaveBeenCalled();
  });

  it("forwards the account email and ISSUER=WBC to the otpauth builder", () => {
    const totp = mockTotp();
    new BeginTotpEnrollment(totp).execute({
      accountEmail: "alice@example.com",
    });

    expect(totp.buildOtpauthUri).toHaveBeenCalledWith({
      accountEmail: "alice@example.com",
      issuer: "WBC",
      secret: "BASE32SECRETXYZ",
    });
  });
});

describe("ConfirmTotpEnrollment", () => {
  it("rejects an invalid code without touching the account row", async () => {
    const totp = mockTotp(() => false);
    const useCase = new ConfirmTotpEnrollment(totp);

    await expect(
      useCase.execute({
        accountId: "acc-1",
        secret: "BASE32SECRETXYZ",
        token: "000000",
      }),
    ).rejects.toThrow();
    expect(updateAccount).not.toHaveBeenCalled();
  });

  it("on success: encrypts the secret, sets totpEnabled, persists HASHED recovery codes", async () => {
    updateAccount.mockResolvedValue({});
    const totp = mockTotp(() => true);
    const useCase = new ConfirmTotpEnrollment(totp);

    const out = await useCase.execute({
      accountId: "acc-1",
      secret: "BASE32SECRETXYZ",
      token: "123456",
    });

    expect(out.recoveryCodes).toHaveLength(10);
    // All codes follow the XXXX-XXXX-XXXX-XXXX-XXXX layout.
    for (const c of out.recoveryCodes) {
      expect(c).toMatch(
        /^[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/,
      );
    }

    expect(updateAccount).toHaveBeenCalledOnce();
    const args = updateAccount.mock.calls[0]![0];
    expect(args.where).toEqual({ id: "acc-1" });
    expect(args.data.totpEnabled).toBe(true);
    expect(args.data.totpActivatedAt).toBeInstanceOf(Date);
    // Stored secret is the AES-GCM triple (iv:ct:tag), not the raw secret.
    expect(args.data.totpSecret).not.toBe("BASE32SECRETXYZ");
    expect(args.data.totpSecret).toMatch(/^[a-f0-9]+:[a-f0-9]+:[a-f0-9]+$/);

    // Persisted recovery codes are SHA-256 hashes — never plaintext.
    expect(args.data.totpRecoveryCodes).toHaveLength(10);
    for (let i = 0; i < out.recoveryCodes.length; i++) {
      const expected = createHash("sha256")
        .update(out.recoveryCodes[i]!)
        .digest("hex");
      expect(args.data.totpRecoveryCodes[i]).toBe(expected);
      // Sanity: plaintext must not appear among stored values.
      expect(args.data.totpRecoveryCodes).not.toContain(out.recoveryCodes[i]);
    }
  });

  it("returns 10 unique recovery codes per enrollment", async () => {
    updateAccount.mockResolvedValue({});
    const useCase = new ConfirmTotpEnrollment(mockTotp(() => true));

    const out = await useCase.execute({
      accountId: "acc-1",
      secret: "BASE32SECRETXYZ",
      token: "123456",
    });
    expect(new Set(out.recoveryCodes).size).toBe(10);
  });
});

describe("VerifyTotp", () => {
  it("returns true for tokens accepted by the port (within ±1 step)", async () => {
    findUniqueAccount.mockResolvedValue({
      totpEnabled: true,
      totpSecret: encryptTotpSecret("BASE32SECRETXYZ"),
      totpRecoveryCodes: [],
    });
    // Port contract: verify accepts current ±1. We model that here by
    // accepting the canonical "live" code and rejecting anything else.
    const totp = mockTotp(({ token }) => token === "live");
    const useCase = new VerifyTotp(totp);

    const ok = await useCase.execute({ accountId: "acc-1", token: "live" });
    expect(ok).toBe(true);
  });

  it("returns false when the port rejects the token (e.g. ±2 steps off)", async () => {
    findUniqueAccount.mockResolvedValue({
      totpEnabled: true,
      totpSecret: encryptTotpSecret("BASE32SECRETXYZ"),
      totpRecoveryCodes: [],
    });
    const totp = mockTotp(() => false); // simulate beyond-window rejection
    const useCase = new VerifyTotp(totp);

    const ok = await useCase.execute({ accountId: "acc-1", token: "stale" });
    expect(ok).toBe(false);
  });

  it("returns false when totp is not enabled on the account", async () => {
    findUniqueAccount.mockResolvedValue({
      totpEnabled: false,
      totpSecret: null,
      totpRecoveryCodes: [],
    });
    const ok = await new VerifyTotp(mockTotp()).execute({
      accountId: "acc-1",
      token: "anything",
    });
    expect(ok).toBe(false);
  });

  it("accepts a recovery code and consumes it (one-shot)", async () => {
    const plaintext = "AAAA-BBBB-CCCC-DDDD-EEEE";
    const hash = createHash("sha256").update(plaintext).digest("hex");
    const otherHash = createHash("sha256")
      .update("FFFF-FFFF-FFFF-FFFF-FFFF")
      .digest("hex");

    findUniqueAccount.mockResolvedValue({
      totpEnabled: true,
      totpSecret: encryptTotpSecret("BASE32SECRETXYZ"),
      totpRecoveryCodes: [hash, otherHash],
    });
    updateAccount.mockResolvedValue({});

    // Live TOTP rejects (forces fallback to recovery-code path).
    const totp = mockTotp(() => false);
    const ok = await new VerifyTotp(totp).execute({
      accountId: "acc-1",
      token: plaintext,
    });

    expect(ok).toBe(true);
    expect(updateAccount).toHaveBeenCalledOnce();
    // Only the unused code remains.
    const args = updateAccount.mock.calls[0]![0];
    expect(args.data.totpRecoveryCodes).toEqual([otherHash]);
  });

  it("rejects an unknown recovery code and does NOT mutate the codes array", async () => {
    findUniqueAccount.mockResolvedValue({
      totpEnabled: true,
      totpSecret: encryptTotpSecret("BASE32SECRETXYZ"),
      totpRecoveryCodes: ["a-known-hash"],
    });
    const ok = await new VerifyTotp(mockTotp(() => false)).execute({
      accountId: "acc-1",
      token: "ZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZ",
    });
    expect(ok).toBe(false);
    expect(updateAccount).not.toHaveBeenCalled();
  });
});

describe("DisableTotp", () => {
  it("requires a valid current TOTP code — wrong code throws and leaves state intact", async () => {
    findUniqueAccount.mockResolvedValue({
      totpEnabled: true,
      totpSecret: encryptTotpSecret("BASE32SECRETXYZ"),
    });
    const totp = mockTotp(() => false);
    const useCase = new DisableTotp(totp);

    await expect(
      useCase.execute({ accountId: "acc-1", currentToken: "000000" }),
    ).rejects.toThrow(/Invalid TOTP/);
    expect(updateAccount).not.toHaveBeenCalled();
  });

  it("clears totpSecret/Enabled/recoveryCodes on success", async () => {
    findUniqueAccount.mockResolvedValue({
      totpEnabled: true,
      totpSecret: encryptTotpSecret("BASE32SECRETXYZ"),
    });
    updateAccount.mockResolvedValue({});
    const totp = mockTotp(() => true);

    await new DisableTotp(totp).execute({
      accountId: "acc-1",
      currentToken: "123456",
    });

    expect(updateAccount).toHaveBeenCalledOnce();
    const args = updateAccount.mock.calls[0]![0];
    expect(args.where).toEqual({ id: "acc-1" });
    expect(args.data).toEqual({
      totpSecret: null,
      totpEnabled: false,
      totpActivatedAt: null,
      totpRecoveryCodes: [],
    });
  });

  it("throws when totp is not enabled on the account (no-op disable)", async () => {
    findUniqueAccount.mockResolvedValue({
      totpEnabled: false,
      totpSecret: null,
    });
    await expect(
      new DisableTotp(mockTotp()).execute({
        accountId: "acc-1",
        currentToken: "123456",
      }),
    ).rejects.toThrow(/not enabled/);
    expect(updateAccount).not.toHaveBeenCalled();
  });
});
