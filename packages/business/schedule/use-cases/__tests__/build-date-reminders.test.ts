// T2.24 — buildDateReminders
//
// The cron uses Date() at module-execution time so we control "today"
// via vi.setSystemTime. Invariants we lock in:
//   - tenantId scopes the client.findMany.
//   - inactive clients are filtered (where.isActive=true).
//   - month-day equality drives the match (year-agnostic for birthdays).
//   - same-day double run is a no-op (existing PENDING row → skipped).
//   - profession map matches case-insensitively (Brazilian PT).
//   - client anniversary requires firstPurchaseAt year < current year
//     (guard against same-year zero-anniversary rows).

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { findManyClient, findFirstReminder, createReminder } = vi.hoisted(
  () => ({
    findManyClient: vi.fn(),
    findFirstReminder: vi.fn(),
    createReminder: vi.fn().mockResolvedValue({ id: "r-new" }),
  }),
);

vi.mock("@wbc/db", () => ({
  prisma: {
    client: { findMany: findManyClient },
    reminder: { findFirst: findFirstReminder, create: createReminder },
  },
}));

import { buildDateReminders } from "../build-date-reminders";

beforeEach(() => {
  findManyClient.mockReset();
  findFirstReminder.mockReset();
  createReminder.mockClear();
  findFirstReminder.mockResolvedValue(null);
  // Pin "today" — May 3, 2026 (a Sunday).
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-05-03T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("buildDateReminders", () => {
  it("scopes the client query to tenantId + isActive", async () => {
    findManyClient.mockResolvedValue([]);
    await buildDateReminders("tenant-X");
    expect(findManyClient).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: "tenant-X", isActive: true },
      }),
    );
  });

  it("creates a BIRTHDAY reminder when birthday matches today (year-agnostic)", async () => {
    findManyClient.mockResolvedValue([
      {
        id: "c1",
        name: "Maria",
        birthday: new Date(Date.UTC(1990, 4, 3)), // May 3, 1990
        profession: null,
        firstPurchaseAt: null,
      },
    ]);

    const r = await buildDateReminders("t1");
    expect(r.birthdays).toBe(1);
    expect(createReminder).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: "t1",
          clientId: "c1",
          type: "BIRTHDAY",
        }),
      }),
    );
  });

  it("does not create a BIRTHDAY when month-day mismatches", async () => {
    findManyClient.mockResolvedValue([
      {
        id: "c1",
        name: "Maria",
        birthday: new Date(Date.UTC(1990, 5, 3)), // June 3 — not today
        profession: null,
        firstPurchaseAt: null,
      },
    ]);

    const r = await buildDateReminders("t1");
    expect(r.birthdays).toBe(0);
    expect(createReminder).not.toHaveBeenCalled();
  });

  it("idempotent: same-day rerun does not duplicate the reminder", async () => {
    findManyClient.mockResolvedValue([
      {
        id: "c1",
        name: "Maria",
        birthday: new Date(Date.UTC(1990, 4, 3)),
        profession: null,
        firstPurchaseAt: null,
      },
    ]);
    findFirstReminder.mockResolvedValue({ id: "r-existing" });

    const r = await buildDateReminders("t1");
    expect(r.birthdays).toBe(0);
    expect(createReminder).not.toHaveBeenCalled();
  });

  it("creates CLIENT_ANNIVERSARY only when firstPurchaseAt year < current year", async () => {
    findManyClient.mockResolvedValue([
      {
        id: "c-anniv",
        name: "Bia",
        birthday: null,
        profession: null,
        firstPurchaseAt: new Date(Date.UTC(2024, 4, 3)), // 2 years ago today
      },
      {
        id: "c-zero",
        name: "Carla",
        birthday: null,
        profession: null,
        firstPurchaseAt: new Date(Date.UTC(2026, 4, 3)), // same year — no anniversary
      },
    ]);

    const r = await buildDateReminders("t1");
    expect(r.anniversaries).toBe(1);
    // Why: only one client (the 2024 one) qualifies; same-year row is skipped.
    expect(createReminder).toHaveBeenCalledTimes(1);
    const data = createReminder.mock.calls[0]?.[0].data;
    expect(data.clientId).toBe("c-anniv");
    expect(data.type).toBe("CLIENT_ANNIVERSARY");
    // Message should mention the year count "2 anos" (plural).
    expect(data.message).toContain("2 anos");
  });

  it("renders singular 'ano' for first-year anniversary", async () => {
    findManyClient.mockResolvedValue([
      {
        id: "c1",
        name: "Bia",
        birthday: null,
        profession: null,
        firstPurchaseAt: new Date(Date.UTC(2025, 4, 3)),
      },
    ]);
    await buildDateReminders("t1");
    const msg = createReminder.mock.calls[0]?.[0].data.message as string;
    expect(msg).toMatch(/1 ano(?!s)/);
  });

  it("matches profession case-insensitively (Brazilian PT)", async () => {
    // Today is 05-03 — no profession in the map matches today, so we
    // pick a profession whose date is today by stubbing the date to
    // 10-15 (professor day).
    vi.setSystemTime(new Date("2026-10-15T12:00:00Z"));
    findManyClient.mockResolvedValue([
      {
        id: "c1",
        name: "Júlia",
        birthday: null,
        profession: "Professora",
        firstPurchaseAt: null,
      },
    ]);

    const r = await buildDateReminders("t1");
    expect(r.professionDays).toBe(1);
    expect(createReminder.mock.calls[0]?.[0].data.type).toBe("PROFESSION_DAY");
  });

  it("returns truthful counts for scanned/birthdays/anniversaries/professionDays", async () => {
    findManyClient.mockResolvedValue([
      {
        id: "c1",
        name: "A",
        birthday: new Date(Date.UTC(1990, 4, 3)), // hit
        profession: null,
        firstPurchaseAt: null,
      },
      {
        id: "c2",
        name: "B",
        birthday: null,
        profession: null,
        firstPurchaseAt: null,
      },
    ]);

    const r = await buildDateReminders("t1");
    expect(r.scanned).toBe(2);
    expect(r.birthdays).toBe(1);
    expect(r.anniversaries).toBe(0);
    expect(r.professionDays).toBe(0);
  });
});
