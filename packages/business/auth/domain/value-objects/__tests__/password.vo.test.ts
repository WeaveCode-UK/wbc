import { describe, it, expect } from "vitest";
import { Password } from "../password.vo";

// Password VO enforces a minimum entropy floor at the domain boundary
// (8 chars + at least one letter + at least one digit). The hashing
// adapter never sees a Password that violates these — so we lock the
// boundary here.

describe("Password.create", () => {
  it("accepts a password meeting all requirements", () => {
    const p = Password.create("abcd1234");
    expect(p.toString()).toBe("abcd1234");
  });

  it("rejects password under 8 characters", () => {
    expect(() => Password.create("a1b2c3")).toThrow(
      "Password must be at least 8 characters",
    );
  });

  it("rejects password without any letter", () => {
    expect(() => Password.create("12345678")).toThrow(
      "Password must contain at least one letter",
    );
  });

  it("rejects password without any digit", () => {
    expect(() => Password.create("abcdefgh")).toThrow(
      "Password must contain at least one number",
    );
  });

  it("accepts long passwords with mixed content", () => {
    const p = Password.create("Some-Long-Pass-9-2026!");
    expect(p.toString()).toBe("Some-Long-Pass-9-2026!");
  });

  it("accepts uppercase letters as letters", () => {
    const p = Password.create("ABCDEFG1");
    expect(p.toString()).toBe("ABCDEFG1");
  });

  // Edge: rejects empty string with the length error first (order matters
  // for UX — the user sees the most fundamental failure).
  it("rejects empty string", () => {
    expect(() => Password.create("")).toThrow(
      "Password must be at least 8 characters",
    );
  });
});
