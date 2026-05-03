import { describe, it, expect } from "vitest";
import { AppointmentNotFoundError, ReminderNotFoundError } from "../errors";

describe("AppointmentNotFoundError", () => {
  it("uses the generic message when id is omitted", () => {
    const e = new AppointmentNotFoundError();
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("AppointmentNotFoundError");
    expect(e.message).toBe("Appointment not found");
  });

  it("includes the appointment id when provided", () => {
    const e = new AppointmentNotFoundError("a-1");
    expect(e.message).toBe("Appointment not found: a-1");
  });
});

describe("ReminderNotFoundError", () => {
  it("uses the generic message when id is omitted", () => {
    const e = new ReminderNotFoundError();
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("ReminderNotFoundError");
    expect(e.message).toBe("Reminder not found");
  });

  it("includes the reminder id when provided", () => {
    const e = new ReminderNotFoundError("r-1");
    expect(e.message).toBe("Reminder not found: r-1");
  });
});
