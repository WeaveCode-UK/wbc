import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "node:crypto";
import { requireEnv } from "@wbc/shared";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;

/**
 * AES-256-GCM wrapper used to keep per-account TOTP secrets out of plaintext
 * at rest. The master key is derived via scrypt from `TOTP_ENCRYPTION_KEY`
 * (env var; required in production). Cipher output is encoded as
 * `iv_hex:ciphertext_hex:tag_hex` so the whole triple lives in one DB column.
 *
 * This is intentionally a tiny, local utility rather than a full KMS client —
 * a real deploy should swap this out for a managed KMS (ACH-016).
 */
function getMasterKey(): Buffer {
  const raw =
    process.env.NODE_ENV === "production"
      ? requireEnv("TOTP_ENCRYPTION_KEY")
      : (process.env.TOTP_ENCRYPTION_KEY ?? "wbc-dev-totp-key");
  // Deterministic KDF with a fixed salt — acceptable because the input is
  // already a high-entropy secret; real KMS would skip this entirely.
  return scryptSync(raw, "wbc-totp-salt", 32);
}

export function encryptTotpSecret(plaintext: string): string {
  const key = getMasterKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${ciphertext.toString("hex")}:${tag.toString("hex")}`;
}

export function decryptTotpSecret(stored: string): string {
  const parts = stored.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid TOTP secret format");
  }
  const [ivHex, ctHex, tagHex] = parts;
  const iv = Buffer.from(ivHex!, "hex");
  const ciphertext = Buffer.from(ctHex!, "hex");
  const tag = Buffer.from(tagHex!, "hex");
  if (tag.length !== TAG_LEN) {
    throw new Error("Invalid TOTP secret auth tag length");
  }
  const key = getMasterKey();
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}
