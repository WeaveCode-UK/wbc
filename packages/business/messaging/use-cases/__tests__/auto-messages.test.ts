// T-coverage — automatic-message handlers
//
// These handlers are subscribed to domain events and translate them
// into ScheduledMessage rows. The contract worth pinning down:
//   - PAYMENT_OVERDUE: only schedules if the client still exists in the
//     tenant; bail out silently otherwise (we don't want orphan
//     messages for deleted clients).
//   - CLIENT_CREATED: skip welcome messages for IMPORT and SPREADSHEET
//     sources — the consultant ran a bulk import and doesn't want every
//     contact to receive an automated WhatsApp.
//   - CLIENT_CREATED (manual): schedules TWO messages — the welcome
//     + an onboarding questionnaire ~24h later.
//   - CASHBACK_EXPIRING: schedules a CASHBACK_EXPIRING message with
//     the formatted amount + days-left.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  handlePaymentOverdue,
  handleClientCreated,
  handleCashbackExpiring,
} from "../auto-messages";
import type { ScheduledMessageRepository } from "../../ports/messaging-repository";

function repoMock(
  overrides: Partial<ScheduledMessageRepository> = {},
): ScheduledMessageRepository {
  return {
    create: vi.fn().mockResolvedValue({ id: "m1" }),
    findClient: vi
      .fn()
      .mockResolvedValue({ name: "Maria", phone: "+5511999999999" }),
    ...overrides,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-05-01T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("handlePaymentOverdue", () => {
  it("creates a BILLING_REMINDER scheduled message when client exists", async () => {
    const repo = repoMock();
    await handlePaymentOverdue("t1", "c1", 150.5, "s1", repo);
    expect(repo.findClient).toHaveBeenCalledWith("t1", "c1");
    expect(repo.create).toHaveBeenCalledOnce();
    const [tenantId, payload] =
      (repo.create as ReturnType<typeof vi.fn>).mock.calls[0] ?? [];
    expect(tenantId).toBe("t1");
    expect(payload.clientId).toBe("c1");
    expect(payload.type).toBe("BILLING_REMINDER");
    expect(payload.message).toContain("R$ 150.50");
  });

  it("silently bails when the client no longer exists (avoid orphan messages)", async () => {
    const repo = repoMock({ findClient: vi.fn().mockResolvedValue(null) });
    await handlePaymentOverdue("t1", "ghost", 100, "s1", repo);
    expect(repo.create).not.toHaveBeenCalled();
  });
});

describe("handleClientCreated", () => {
  it("schedules a WELCOME + onboarding questionnaire (~24h later) for MANUAL clients", async () => {
    const repo = repoMock();
    await handleClientCreated("t1", "c1", "MANUAL", repo);
    expect(repo.create).toHaveBeenCalledTimes(2);
    const types = (repo.create as ReturnType<typeof vi.fn>).mock.calls.map(
      (c) => c[1].type,
    );
    expect(types).toEqual(["WELCOME", "CUSTOM"]);
    // Second message is scheduled ~24h after now.
    const second = (repo.create as ReturnType<typeof vi.fn>).mock.calls[1]?.[1];
    const delta = second.sendAt.getTime() - new Date().getTime();
    // Within 1 second of 24h to absorb any clock drift.
    expect(Math.abs(delta - 24 * 60 * 60 * 1000)).toBeLessThan(1000);
  });

  it("skips welcome+questionnaire for IMPORT (bulk import — don't spam)", async () => {
    const repo = repoMock();
    await handleClientCreated("t1", "c1", "IMPORT", repo);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("skips welcome+questionnaire for SPREADSHEET source", async () => {
    const repo = repoMock();
    await handleClientCreated("t1", "c1", "SPREADSHEET", repo);
    expect(repo.create).not.toHaveBeenCalled();
  });
});

describe("handleCashbackExpiring", () => {
  it("creates a CASHBACK_EXPIRING message with formatted amount + days", async () => {
    const repo = repoMock();
    await handleCashbackExpiring("t1", "c1", 25.5, 7, repo);
    expect(repo.create).toHaveBeenCalledOnce();
    const [tenantId, payload] =
      (repo.create as ReturnType<typeof vi.fn>).mock.calls[0] ?? [];
    expect(tenantId).toBe("t1");
    expect(payload.type).toBe("CASHBACK_EXPIRING");
    expect(payload.message).toContain("R$ 25.50");
    expect(payload.message).toContain("7 dias");
  });
});
