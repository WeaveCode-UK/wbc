// T9.7 — PII redaction guard. The redactSecurityFields helper is the
// project's last line of defence before identifiers, phone numbers and
// emails reach Pino / Sentry / log aggregators. We assert:
//   - phone: only last 4 digits visible, the rest masked
//   - id: first 8 chars + ellipsis (deterministic — same id always same redaction)
//   - email: SHA-256 hash, never reversible to the source
//   - composite payload: every known field is replaced; unknown fields pass through
import { describe, it, expect } from "vitest";
import {
  redactPhone,
  redactId,
  redactEmail,
  redactSecurityFields,
} from "../redaction";

describe("redactPhone", () => {
  it("masks all but the last 4 digits of a Brazilian mobile", () => {
    expect(redactPhone("+5511987654321")).toBe("*********4321");
  });

  it("returns **** for sub-5-digit input", () => {
    expect(redactPhone("123")).toBe("****");
  });

  it("strips non-digit chars before counting", () => {
    // 10 digits → 6 masked + 4 visible.
    expect(redactPhone("(11) 9876-5432")).toBe("******5432");
  });

  it("passes undefined / empty through unchanged", () => {
    expect(redactPhone(undefined)).toBeUndefined();
    expect(redactPhone("")).toBe("");
  });
});

describe("redactId", () => {
  it("keeps the first 8 chars and elides the rest", () => {
    expect(redactId("abcdef12-3456-7890-abcd-ef1234567890")).toBe("abcdef12…");
  });

  it("leaves short ids untouched (already not identifying)", () => {
    expect(redactId("short")).toBe("short");
  });

  it("is deterministic — same input → same output", () => {
    expect(redactId("u-12345678901234")).toBe(redactId("u-12345678901234"));
  });
});

describe("redactEmail", () => {
  it("returns a SHA-256-prefixed token, never the raw email", () => {
    const out = redactEmail("alice@example.com");
    expect(out).toMatch(/^email#[a-f0-9]{12}$/);
    expect(out).not.toContain("alice");
    expect(out).not.toContain("example.com");
  });

  it("normalises case before hashing", () => {
    expect(redactEmail("Alice@Example.com")).toBe(
      redactEmail("alice@example.com"),
    );
  });

  it("returns the same hash on repeated calls (deterministic)", () => {
    expect(redactEmail("a@b.com")).toBe(redactEmail("a@b.com"));
  });
});

describe("redactSecurityFields composite", () => {
  it("redacts every known PII field in one pass", () => {
    const out = redactSecurityFields({
      phone: "+5511987654321",
      userId: "user-aaaaaaaa-bbbbbbbb",
      tenantId: "tenant-cccccccc",
      accountId: "acc-dddddddd-eeeeeeee",
      email: "test@example.com",
      jti: "jti-12345678",
    });
    expect(out.phone).toBe("*********4321");
    expect(out.userId).toBe("user-aaa…");
    expect(out.tenantId).toBe("tenant-c…");
    expect(out.accountId).toBe("acc-dddd…");
    expect(out.email).toMatch(/^email#[a-f0-9]{12}$/);
    expect(out.jti).toBe("jti-1234…");
  });

  it("preserves untracked fields verbatim — never strips operational context", () => {
    const out = redactSecurityFields({
      phone: "+5511987654321",
      // @ts-expect-error — extra field not in the typed signature
      ipAddress: "192.168.0.1",
      // @ts-expect-error
      userAgent: "Mozilla/5.0",
    });
    expect((out as Record<string, unknown>).ipAddress).toBe("192.168.0.1");
    expect((out as Record<string, unknown>).userAgent).toBe("Mozilla/5.0");
  });

  it("never leaks the raw email even when payload is JSON.stringified", () => {
    const out = redactSecurityFields({
      email: "leak-me@example.com",
      userId: "u-1234567890",
    });
    expect(JSON.stringify(out)).not.toContain("leak-me@example.com");
  });

  it("never leaks more than the last 4 digits of phone — even after stringify", () => {
    const out = redactSecurityFields({ phone: "+5511987654321" });
    const json = JSON.stringify(out);
    // Full middle digits must NOT appear.
    expect(json).not.toContain("987654");
    expect(json).toContain("4321"); // last 4 ok by design
  });
});
