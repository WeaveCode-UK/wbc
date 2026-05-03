import { describe, it, expect } from "vitest";
import { Password } from "../value-objects/password.vo";

// T1.7 — Password policy invariants.
// Source: packages/business/auth/domain/value-objects/password.vo.ts
//   - >= 8 characters
//   - at least one letter
//   - at least one number
// Throws Error("Password must ...") on violation.

describe("Password.create — length policy", () => {
  it("rejects empty string", () => {
    expect(() => Password.create("")).toThrow(/at least 8/);
  });

  it("rejects 7 characters", () => {
    expect(() => Password.create("abc1234")).toThrow(/at least 8/);
  });

  it("accepts exactly 8 characters with letter+digit", () => {
    expect(() => Password.create("abcd1234")).not.toThrow();
  });

  it("accepts long passwords", () => {
    expect(() =>
      Password.create("aVeryLongPasswordWith9999Digits"),
    ).not.toThrow();
  });
});

describe("Password.create — complexity policy", () => {
  it("rejects 8+ chars with only digits", () => {
    expect(() => Password.create("12345678")).toThrow(/letter/);
  });

  it("rejects 8+ chars with only letters", () => {
    expect(() => Password.create("abcdefgh")).toThrow(/number/);
  });

  it("rejects 8+ chars with letters + symbols but no digit", () => {
    expect(() => Password.create("abcdefg!")).toThrow(/number/);
  });

  it("accepts mixed letters and digits", () => {
    expect(() => Password.create("password1")).not.toThrow();
  });

  it("accepts uppercase letter satisfies letter requirement", () => {
    expect(() => Password.create("PASSWORD1")).not.toThrow();
  });

  it("accepts password with letter, digit, and symbols", () => {
    expect(() => Password.create("P@ssw0rd!")).not.toThrow();
  });
});

describe("Password — value preservation", () => {
  it("toString returns the original value", () => {
    const raw = "secret123";
    expect(Password.create(raw).toString()).toBe(raw);
  });

  it("does not trim or normalize whitespace inside value", () => {
    // Spaces are allowed by the regex (length+letter+digit are met).
    const raw = "abc 1234";
    expect(Password.create(raw).toString()).toBe(raw);
  });
});
