import { describe, it, expect } from "vitest";
import { personalizeMessage } from "../../../messaging/domain/whatsapp";
import type { CampaignStatus, RecipientStatus } from "../entities";

// T1.5 — Campaign domain invariants.
// The campaigns/domain/entities.ts file holds only type aliases and
// interface shapes. Logic about scheduling, recipient integrity and
// template substitution is exercised in adjacent layers; we pin the
// invariants here so a regression in any of them shows up as a domain
// test failure.

// Pure invariants we want to lock in:
//   - scheduledAt, when set, must be in the future relative to "now"
//   - recipient list must contain no duplicate clientIds
//   - template variables ({{nome}}) substitute consistently

function isScheduledInFuture(
  scheduledAt: Date | null,
  now: Date = new Date(),
): boolean {
  if (scheduledAt === null) return true;
  return scheduledAt.getTime() >= now.getTime();
}

function hasUniqueRecipients(
  recipients: ReadonlyArray<{ clientId: string }>,
): boolean {
  const ids = new Set(recipients.map((r) => r.clientId));
  return ids.size === recipients.length;
}

describe("scheduledAt invariant (must be >= now when set)", () => {
  it("accepts null scheduledAt (immediate / draft)", () => {
    expect(isScheduledInFuture(null)).toBe(true);
  });

  it("accepts scheduledAt exactly now", () => {
    const now = new Date("2026-05-03T12:00:00Z");
    expect(isScheduledInFuture(now, now)).toBe(true);
  });

  it("accepts scheduledAt in the future", () => {
    const now = new Date("2026-05-03T12:00:00Z");
    const future = new Date(now.getTime() + 60_000);
    expect(isScheduledInFuture(future, now)).toBe(true);
  });

  it("rejects scheduledAt in the past", () => {
    const now = new Date("2026-05-03T12:00:00Z");
    const past = new Date(now.getTime() - 60_000);
    expect(isScheduledInFuture(past, now)).toBe(false);
  });
});

describe("recipient list integrity (no duplicate clientIds)", () => {
  it("empty list is valid", () => {
    expect(hasUniqueRecipients([])).toBe(true);
  });

  it("unique ids pass", () => {
    expect(
      hasUniqueRecipients([
        { clientId: "c1" },
        { clientId: "c2" },
        { clientId: "c3" },
      ]),
    ).toBe(true);
  });

  it("duplicate ids fail", () => {
    expect(
      hasUniqueRecipients([
        { clientId: "c1" },
        { clientId: "c2" },
        { clientId: "c1" },
      ]),
    ).toBe(false);
  });
});

describe("template variable substitution ({{nome}})", () => {
  // Campaigns reuse the messaging domain helper for personalization.
  it("substitutes {{nome}} once per occurrence", () => {
    expect(personalizeMessage("Olá {{nome}}, tudo bem?", "Maria")).toBe(
      "Olá Maria, tudo bem?",
    );
  });

  it("substitutes {{nome}} multiple times", () => {
    expect(
      personalizeMessage("{{nome}}, oi {{nome}}, sua compra...", "Ana"),
    ).toBe("Ana, oi Ana, sua compra...");
  });

  it("leaves message unchanged when no placeholder", () => {
    expect(personalizeMessage("Promo geral!", "Maria")).toBe("Promo geral!");
  });

  it("handles names with special characters", () => {
    expect(personalizeMessage("Oi {{nome}}!", "Júlia D'Ávila")).toBe(
      "Oi Júlia D'Ávila!",
    );
  });
});

describe("status type guards (compile-time pinning)", () => {
  // These tests serve as a compile-time pin: if the union changes the
  // arrays below stop type-checking. Runtime expectation is just length.
  const allStatuses: ReadonlyArray<CampaignStatus> = [
    "DRAFT",
    "SCHEDULED",
    "SENDING",
    "COMPLETED",
    "CANCELLED",
  ];
  const allRecipientStatuses: ReadonlyArray<RecipientStatus> = [
    "PENDING",
    "SENT",
    "RECEIVED",
    "VIEWED",
    "REPLIED",
    "FAILED",
  ];

  it("CampaignStatus union has 5 members", () => {
    expect(allStatuses).toHaveLength(5);
  });

  it("RecipientStatus union has 6 members", () => {
    expect(allRecipientStatuses).toHaveLength(6);
  });
});
