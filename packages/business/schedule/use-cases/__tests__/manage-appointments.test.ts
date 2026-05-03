// T-coverage — appointment + reminder + calendar pass-throughs
//
// All public functions are thin wrappers over ScheduleRepository.
// updateAppointment + deleteAppointment gate the destructive call on a
// tenant-scoped findAppointment so a hostile id from another tenant
// can't slip through. We assert each guard fires.
import { describe, it, expect, vi } from "vitest";
import {
  listAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  listReminders,
  dismissReminder,
  getUpcomingBirthdays,
  getMyDay,
  getCalendar,
} from "../manage-appointments";
import { AppointmentNotFoundError } from "../../domain/errors";
import type { ScheduleRepository } from "../../ports/schedule-repository";

function repoMock(
  overrides: Partial<ScheduleRepository> = {},
): ScheduleRepository {
  return {
    listAppointments: vi.fn().mockResolvedValue([]),
    createAppointment: vi.fn().mockResolvedValue({ id: "a-new" }),
    findAppointment: vi.fn().mockResolvedValue({ id: "a1", tenantId: "t1" }),
    updateAppointment: vi.fn().mockResolvedValue({ id: "a1" }),
    deleteAppointment: vi.fn().mockResolvedValue(undefined),
    listReminders: vi.fn().mockResolvedValue([]),
    dismissReminder: vi.fn().mockResolvedValue({ id: "r1" }),
    getUpcomingBirthdays: vi.fn().mockResolvedValue([]),
    getMyDay: vi.fn().mockResolvedValue({
      reminders: [],
      appointments: [],
      pendingBillings: [],
      birthdays: [],
      opportunities: [],
    }),
    getCalendar: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

describe("listAppointments", () => {
  it("forwards tenantId + dateRange verbatim", async () => {
    const repo = repoMock();
    const range = { from: new Date("2026-05-01"), to: new Date("2026-05-31") };
    await listAppointments("t1", range, repo);
    expect(repo.listAppointments).toHaveBeenCalledWith("t1", range);
  });

  it("forwards undefined dateRange (means 'all')", async () => {
    const repo = repoMock();
    await listAppointments("t1", undefined, repo);
    expect(repo.listAppointments).toHaveBeenCalledWith("t1", undefined);
  });
});

describe("createAppointment", () => {
  it("delegates to repo.createAppointment with the full payload", async () => {
    const repo = repoMock();
    const data = {
      title: "Hair",
      type: "VISIT",
      clientId: "c1",
      startsAt: new Date("2026-05-10T10:00:00Z"),
    };
    await createAppointment("t1", data, repo);
    expect(repo.createAppointment).toHaveBeenCalledWith("t1", data);
  });
});

describe("updateAppointment", () => {
  it("updates when appointment exists in tenant", async () => {
    const repo = repoMock();
    await updateAppointment("t1", "a1", { title: "New" }, repo);
    expect(repo.findAppointment).toHaveBeenCalledWith("t1", "a1");
    expect(repo.updateAppointment).toHaveBeenCalledWith("t1", "a1", {
      title: "New",
    });
  });

  it("throws AppointmentNotFoundError when missing", async () => {
    const repo = repoMock({ findAppointment: vi.fn().mockResolvedValue(null) });
    await expect(
      updateAppointment("t1", "ghost", { title: "X" }, repo),
    ).rejects.toThrow(AppointmentNotFoundError);
    expect(repo.updateAppointment).not.toHaveBeenCalled();
  });
});

describe("deleteAppointment", () => {
  it("deletes when appointment exists in tenant", async () => {
    const repo = repoMock();
    await deleteAppointment("t1", "a1", repo);
    expect(repo.findAppointment).toHaveBeenCalledWith("t1", "a1");
    expect(repo.deleteAppointment).toHaveBeenCalledWith("t1", "a1");
  });

  it("throws AppointmentNotFoundError when missing", async () => {
    const repo = repoMock({ findAppointment: vi.fn().mockResolvedValue(null) });
    await expect(deleteAppointment("t1", "ghost", repo)).rejects.toThrow(
      AppointmentNotFoundError,
    );
    expect(repo.deleteAppointment).not.toHaveBeenCalled();
  });
});

describe("listReminders / dismissReminder", () => {
  it("forwards tenantId + status + type filters", async () => {
    const repo = repoMock();
    await listReminders("t1", "PENDING", "RESTOCK", repo);
    expect(repo.listReminders).toHaveBeenCalledWith("t1", "PENDING", "RESTOCK");
  });

  it("dismissReminder forwards (tenantId, id)", async () => {
    const repo = repoMock();
    await dismissReminder("t1", "r1", repo);
    expect(repo.dismissReminder).toHaveBeenCalledWith("t1", "r1");
  });
});

describe("getUpcomingBirthdays", () => {
  it("returns empty array when repo is undefined (defensive)", async () => {
    const out = await getUpcomingBirthdays("t1", 30);
    expect(out).toEqual([]);
  });

  it("forwards tenantId + days when repo is provided", async () => {
    const repo = repoMock();
    await getUpcomingBirthdays("t1", 60, repo);
    expect(repo.getUpcomingBirthdays).toHaveBeenCalledWith("t1", 60);
  });

  it("uses 30-day default when days arg is omitted", async () => {
    const repo = repoMock();
    // Calling without an explicit days arg lets the default kick in.
    await getUpcomingBirthdays("t1", undefined as unknown as number, repo);
    expect(repo.getUpcomingBirthdays).toHaveBeenCalledWith("t1", 30);
  });
});

describe("getMyDay / getCalendar", () => {
  it("getMyDay forwards tenantId verbatim", async () => {
    const repo = repoMock();
    const out = await getMyDay("t1", repo);
    expect(repo.getMyDay).toHaveBeenCalledWith("t1");
    expect(out).toHaveProperty("appointments");
    expect(out).toHaveProperty("reminders");
  });

  it("getCalendar forwards tenantId + month + year", async () => {
    const repo = repoMock();
    await getCalendar("t1", 5, 2026, repo);
    expect(repo.getCalendar).toHaveBeenCalledWith("t1", 5, 2026);
  });
});
