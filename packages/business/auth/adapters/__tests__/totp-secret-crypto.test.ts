// Coverage gap: totp-secret-crypto sits in the auth domain's hot path
// (every TOTP enrol + verify decrypts the per-account secret) and was at
// 0% unit coverage. The adapter is a small AES-256-GCM wrapper, but the
// failure modes that bite in prod are silent — wrong tag length, IV not
// random per call, malformed `iv:ct:tag` triple — so we lock them here.
//
// We do NOT mock node:crypto. The whole point of these tests is to
// exercise the real cipher: anything weaker is a tautology.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { encryptTotpSecret, decryptTotpSecret } from "../totp-secret-crypto";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  // Use the dev fallback so tests don't require an env var; production
  // requireEnv path is exercised in its own block below.
  delete process.env.TOTP_ENCRYPTION_KEY;
  (process.env as Record<string, string>).NODE_ENV = "test";
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("encryptTotpSecret + decryptTotpSecret — round-trip", () => {
  it("decrypt(encrypt(x)) === x for a typical TOTP secret", () => {
    const plain = "JBSWY3DPEHPK3PXP"; // base32-shaped, 16 chars
    const cipher = encryptTotpSecret(plain);
    expect(decryptTotpSecret(cipher)).toBe(plain);
  });

  it("round-trips multi-byte unicode (defensive: secret format is opaque)", () => {
    const plain = "Olá-секрет-🔐";
    const cipher = encryptTotpSecret(plain);
    expect(decryptTotpSecret(cipher)).toBe(plain);
  });

  it("round-trips an empty string (degenerate but legal input)", () => {
    const cipher = encryptTotpSecret("");
    expect(decryptTotpSecret(cipher)).toBe("");
  });

  it("produces fresh IV per call → same plaintext yields different ciphertext", () => {
    // GCM with a deterministic IV is a known-broken pattern. If a refactor
    // ever cached the IV, two encryptions of the same secret would match
    // — that's the regression this catches.
    const a = encryptTotpSecret("same");
    const b = encryptTotpSecret("same");
    expect(a).not.toBe(b);
    expect(decryptTotpSecret(a)).toBe("same");
    expect(decryptTotpSecret(b)).toBe("same");
  });

  it("encodes the triple as `iv:ct:tag` with hex segments", () => {
    const cipher = encryptTotpSecret("topsecret");
    const parts = cipher.split(":");
    expect(parts).toHaveLength(3);
    // 12-byte IV → 24 hex chars; 16-byte tag → 32 hex chars.
    expect(parts[0]!.length).toBe(24);
    expect(parts[2]!.length).toBe(32);
    expect(/^[0-9a-f]+$/i.test(parts[0]!)).toBe(true);
    expect(/^[0-9a-f]+$/i.test(parts[2]!)).toBe(true);
  });
});

describe("decryptTotpSecret — input validation", () => {
  it("throws on a stored value with the wrong number of segments", () => {
    expect(() => decryptTotpSecret("only-one-part")).toThrow(
      /Invalid TOTP secret format/,
    );
    expect(() => decryptTotpSecret("a:b")).toThrow(
      /Invalid TOTP secret format/,
    );
    expect(() => decryptTotpSecret("a:b:c:d")).toThrow(
      /Invalid TOTP secret format/,
    );
  });

  it("throws on a tag with the wrong length (not 16 bytes)", () => {
    // Forge a triple where iv/ct are valid hex but tag is 8 bytes — the
    // GCM check rejects before authentication, so we verify our explicit
    // length guard runs first (clearer error message for ops).
    const fakeIv = "0".repeat(24);
    const fakeCt = "00";
    const shortTag = "0".repeat(16); // 8 bytes
    expect(() => decryptTotpSecret(`${fakeIv}:${fakeCt}:${shortTag}`)).toThrow(
      /Invalid TOTP secret auth tag length/,
    );
  });

  it("throws when the ciphertext was tampered with (auth tag mismatch)", () => {
    const cipher = encryptTotpSecret("hello");
    const [iv, ct, tag] = cipher.split(":");
    // Flip the first ciphertext byte. GCM auth must catch this.
    const flipped = (parseInt(ct!.slice(0, 2), 16) ^ 0xff)
      .toString(16)
      .padStart(2, "0");
    const tampered = `${iv}:${flipped}${ct!.slice(2)}:${tag}`;
    expect(() => decryptTotpSecret(tampered)).toThrow();
  });
});

describe("getMasterKey — production guardrail", () => {
  it("throws when NODE_ENV=production and TOTP_ENCRYPTION_KEY is missing", () => {
    (process.env as Record<string, string>).NODE_ENV = "production";
    delete process.env.TOTP_ENCRYPTION_KEY;
    // The function is private; exercise via the public API.
    expect(() => encryptTotpSecret("x")).toThrow(/TOTP_ENCRYPTION_KEY/);
  });

  it("uses TOTP_ENCRYPTION_KEY in production when set, allowing decrypt later", () => {
    (process.env as Record<string, string>).NODE_ENV = "production";
    process.env.TOTP_ENCRYPTION_KEY = "production-grade-master-secret";
    const cipher = encryptTotpSecret("rot");
    expect(decryptTotpSecret(cipher)).toBe("rot");
  });

  it("dev fallback key still produces a valid round-trip without env var", () => {
    delete process.env.TOTP_ENCRYPTION_KEY;
    (process.env as Record<string, string>).NODE_ENV = "development";
    const cipher = encryptTotpSecret("dev-secret");
    expect(decryptTotpSecret(cipher)).toBe("dev-secret");
  });
});
