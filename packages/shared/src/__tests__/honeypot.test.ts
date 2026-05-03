import { describe, it, expect } from "vitest";
import { HONEYPOT_FIELD_NAME, isHoneypotTripped } from "../anti-bot/honeypot";

// ACH-072 seguranca: honeypot input. Bots fill the hidden field a real
// user never sees; tripped requests must be silently rejected. Tests
// pin both the field name (UI references it) and the trip semantics.

describe("HONEYPOT_FIELD_NAME", () => {
  it("uses the canonical hidden-field name", () => {
    // Locked: the React form references this exact string.
    expect(HONEYPOT_FIELD_NAME).toBe("__hp");
  });
});

describe("isHoneypotTripped", () => {
  it("returns false when the honeypot key is missing entirely", () => {
    expect(isHoneypotTripped({})).toBe(false);
  });

  it("returns false when the value is undefined", () => {
    expect(isHoneypotTripped({ __hp: undefined })).toBe(false);
  });

  it("returns false when the value is null", () => {
    expect(isHoneypotTripped({ __hp: null })).toBe(false);
  });

  it("returns false when the value is an empty string", () => {
    expect(isHoneypotTripped({ __hp: "" })).toBe(false);
  });

  it("returns false when the value is whitespace-only", () => {
    expect(isHoneypotTripped({ __hp: "   " })).toBe(false);
  });

  it("returns true when the value is a non-empty string (bot)", () => {
    expect(isHoneypotTripped({ __hp: "bot-input" })).toBe(true);
  });

  it("returns true when the value is a non-string truthy type (bot heuristic)", () => {
    // Bots that round-trip JSON sometimes serialise as numbers or booleans.
    expect(isHoneypotTripped({ __hp: 1 })).toBe(true);
    expect(isHoneypotTripped({ __hp: true })).toBe(true);
  });

  it("returns true when the value is 0 (still set)", () => {
    // Domain says "non-empty value -> tripped". 0 is set, so it counts.
    expect(isHoneypotTripped({ __hp: 0 })).toBe(true);
  });

  it("ignores other fields in the input", () => {
    expect(isHoneypotTripped({ name: "Ana", email: "a@b.com" })).toBe(false);
  });
});
