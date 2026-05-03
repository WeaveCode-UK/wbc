import { describe, it, expect } from "vitest";
import { Email } from "../email.vo";

// Email VO normalises (trim + lowercase) and gates on a minimal
// shape regex. Equality compares the normalised value, so casing/
// whitespace differences must not desync user lookups.

describe("Email.create", () => {
  it("accepts a well-formed email", () => {
    const e = Email.create("user@example.com");
    expect(e.toString()).toBe("user@example.com");
  });

  it("trims surrounding whitespace", () => {
    const e = Email.create("  user@example.com  ");
    expect(e.toString()).toBe("user@example.com");
  });

  it("lowercases the value (DB lookups are case-insensitive)", () => {
    const e = Email.create("User@Example.COM");
    expect(e.toString()).toBe("user@example.com");
  });

  it("rejects email without @", () => {
    expect(() => Email.create("not-an-email")).toThrow("Invalid email format");
  });

  it("rejects email without dot in domain", () => {
    expect(() => Email.create("user@example")).toThrow("Invalid email format");
  });

  it("rejects empty string", () => {
    expect(() => Email.create("")).toThrow("Invalid email format");
  });

  it("rejects email with spaces inside", () => {
    expect(() => Email.create("user @example.com")).toThrow(
      "Invalid email format",
    );
  });

  it("rejects email with two @", () => {
    expect(() => Email.create("a@b@c.com")).toThrow("Invalid email format");
  });
});

describe("Email.equals", () => {
  it("treats normalised forms as equal", () => {
    const a = Email.create("User@Example.com");
    const b = Email.create("user@example.com");
    expect(a.equals(b)).toBe(true);
  });

  it("treats trim-different inputs as equal", () => {
    const a = Email.create("  user@example.com");
    const b = Email.create("user@example.com  ");
    expect(a.equals(b)).toBe(true);
  });

  it("treats different addresses as not equal", () => {
    const a = Email.create("a@example.com");
    const b = Email.create("b@example.com");
    expect(a.equals(b)).toBe(false);
  });
});
