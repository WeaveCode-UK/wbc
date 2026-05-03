import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MonthCalendar, type MonthCalendarEvent } from "../month-calendar";

// T4.3 — MonthCalendar: dot color per type (purple/orange/beauty),
// month navigation, day click delivers correct events.

describe("MonthCalendar", () => {
  it("renders the month label", () => {
    render(<MonthCalendar month={new Date(2026, 4, 15)} />);
    expect(screen.getByText(/Maio 2026/)).toBeInTheDocument();
  });

  it("shows weekday labels starting on Monday by default", () => {
    render(<MonthCalendar month={new Date(2026, 4, 15)} />);
    const labels = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];
    for (const label of labels) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("renders 42 day cells (6 rows × 7 cols)", () => {
    const { container } = render(
      <MonthCalendar month={new Date(2026, 4, 15)} />,
    );
    // The first 7 elements with role-like styling are weekday labels;
    // count both buttons and divs that have aspect-square class.
    const dayCells = container.querySelectorAll(".aspect-square");
    expect(dayCells.length).toBe(42);
  });

  it("renders dots colored per event type (purple/orange/beauty)", () => {
    const events: MonthCalendarEvent[] = [
      { date: new Date(2026, 4, 5), type: "appointment", label: "Visit" },
      { date: new Date(2026, 4, 5), type: "reminder", label: "Birthday" },
      { date: new Date(2026, 4, 5), type: "birthday", label: "Bday" },
    ];
    const { container } = render(
      <MonthCalendar month={new Date(2026, 4, 15)} events={events} />,
    );
    const dots = container.querySelectorAll(".rounded-full");
    const styles = Array.from(dots).map(
      (d) => (d as HTMLElement).style.background,
    );
    expect(styles).toContain("var(--wc-purple)");
    expect(styles).toContain("var(--wc-orange)");
    expect(styles).toContain("var(--wc-beauty)");
  });

  it("calls onMonthChange with the previous month on prev click", () => {
    const onMonthChange = vi.fn();
    render(
      <MonthCalendar
        month={new Date(2026, 4, 15)}
        onMonthChange={onMonthChange}
      />,
    );
    fireEvent.click(screen.getByLabelText("Mês anterior"));
    const arg = onMonthChange.mock.calls[0]?.[0] as Date;
    expect(arg.getFullYear()).toBe(2026);
    expect(arg.getMonth()).toBe(3); // April
    expect(arg.getDate()).toBe(1);
  });

  it("calls onMonthChange with the next month on next click", () => {
    const onMonthChange = vi.fn();
    render(
      <MonthCalendar
        month={new Date(2026, 4, 15)}
        onMonthChange={onMonthChange}
      />,
    );
    fireEvent.click(screen.getByLabelText("Próximo mês"));
    const arg = onMonthChange.mock.calls[0]?.[0] as Date;
    expect(arg.getFullYear()).toBe(2026);
    expect(arg.getMonth()).toBe(5); // June
  });

  it("does not render navigation when onMonthChange is not provided", () => {
    render(<MonthCalendar month={new Date(2026, 4, 15)} />);
    expect(screen.queryByLabelText("Mês anterior")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Próximo mês")).not.toBeInTheDocument();
  });

  it("clicking a day calls onDayClick with that day and its events", () => {
    const onDayClick = vi.fn();
    const targetDay = new Date(2026, 4, 10);
    const events: MonthCalendarEvent[] = [
      { date: targetDay, type: "appointment", label: "Visit Maria" },
    ];
    render(
      <MonthCalendar
        month={new Date(2026, 4, 15)}
        events={events}
        onDayClick={onDayClick}
      />,
    );
    fireEvent.click(screen.getByLabelText("10 — 1 eventos"));
    expect(onDayClick).toHaveBeenCalledTimes(1);
    const [day, evs] = onDayClick.mock.calls[0] as [Date, MonthCalendarEvent[]];
    expect(day.getDate()).toBe(10);
    expect(evs).toHaveLength(1);
    expect(evs[0]?.label).toBe("Visit Maria");
  });

  it("shows '+N' indicator when more than 3 events on a single day", () => {
    const day = new Date(2026, 4, 7);
    const events: MonthCalendarEvent[] = Array.from({ length: 5 }).map(
      (_, i) => ({ date: day, type: "appointment", label: `e${i}` }),
    );
    render(<MonthCalendar month={new Date(2026, 4, 15)} events={events} />);
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("respects weekStartsOn=0 for Sunday-first weekday header", () => {
    render(<MonthCalendar month={new Date(2026, 4, 15)} weekStartsOn={0} />);
    const headers = screen.getAllByText(/^(seg|ter|qua|qui|sex|sáb|dom)$/i);
    // Sunday-first: the first weekday-cell text is "dom"
    expect(headers[0]?.textContent).toBe("dom");
  });
});
