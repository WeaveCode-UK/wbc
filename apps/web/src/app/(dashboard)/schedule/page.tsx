"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Bell, Cake, Calendar } from "lucide-react";
import {
  Badge,
  Button,
  EmptyState,
  ListItem,
  ListSkeleton,
  MonthCalendar,
  SegmentedControl,
  type MonthCalendarEvent,
} from "@wbc/ui";
import { trpc } from "@/lib/trpc";
import { AddAppointmentModal } from "@/components/add-appointment-modal";

// The schedule port intentionally returns `unknown[]` from the repo, so
// the procedure output is also `unknown[]`. Re-narrow at the consumer.
interface AppointmentRow {
  id: string;
  title: string;
  type: string;
  startsAt: string | Date;
  address: string | null;
}
interface ReminderRow {
  id: string;
  title: string;
  type: string;
  triggerDate: string | Date;
}
interface BirthdayRow {
  id: string;
  name: string;
  birthday: string | Date | null;
}

function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

export default function SchedulePage() {
  const t = useTranslations("schedule");
  const [addOpen, setAddOpen] = useState(false);
  const [view, setView] = useState<"list" | "calendar">("list");
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<{
    date: Date;
    events: MonthCalendarEvent[];
  } | null>(null);

  const appointments = trpc.schedule.listAppointments.useQuery({});
  const birthdays = trpc.schedule.getUpcomingBirthdays.useQuery({});
  const reminders = trpc.schedule.listReminders.useQuery({});

  const appsData = (appointments.data ?? []) as AppointmentRow[];
  const birthdaysData = (birthdays.data ?? []) as BirthdayRow[];
  const remindersData = (reminders.data ?? []) as ReminderRow[];

  // Bloco 8 do plano: agrega 3 fontes em eventos do calendário.
  const calendarEvents = useMemo<MonthCalendarEvent[]>(() => {
    const events: MonthCalendarEvent[] = [];
    for (const a of appsData) {
      events.push({
        date: new Date(a.startsAt),
        type: "appointment",
        label: a.title,
      });
    }
    for (const r of remindersData) {
      events.push({
        date: new Date(r.triggerDate),
        type: "reminder",
        label: r.title,
      });
    }
    for (const b of birthdaysData) {
      if (!b.birthday) continue;
      events.push({
        date: new Date(b.birthday),
        type: "birthday",
        label: `🎂 ${b.name}`,
      });
    }
    return events;
  }, [appsData, remindersData, birthdaysData]);

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
          {t("title")}
        </h1>
        <Button type="button" size="sm" onClick={() => setAddOpen(true)}>
          {t("new_appointment")}
        </Button>
      </header>

      <AddAppointmentModal open={addOpen} onClose={() => setAddOpen(false)} />

      <SegmentedControl
        value={view}
        onChange={(v) => setView(v as "list" | "calendar")}
        options={[
          { value: "list", label: t("view_list") },
          { value: "calendar", label: t("view_calendar") },
        ]}
      />

      {view === "calendar" && (
        <section className="rounded-wc-lg border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] shadow-wc-xs p-3 sm:p-5">
          <MonthCalendar
            month={calendarMonth}
            events={calendarEvents}
            onMonthChange={setCalendarMonth}
            onDayClick={(date, events) =>
              setSelectedDay(events.length > 0 ? { date, events } : null)
            }
          />
          {selectedDay && (
            <div className="mt-4 border-t border-[var(--wc-border)] pt-3">
              <h3 className="text-[14px] font-semibold text-[var(--wc-fg-1)]">
                {new Intl.DateTimeFormat("pt-BR", {
                  dateStyle: "full",
                }).format(selectedDay.date)}
              </h3>
              <ul className="mt-2 space-y-1">
                {selectedDay.events.map((e, i) => (
                  <li
                    key={i}
                    className="text-[13px] text-[var(--wc-fg-2)] flex items-center gap-2"
                  >
                    <span
                      aria-hidden="true"
                      className="inline-block h-2 w-2 rounded-full"
                      style={{
                        background:
                          e.type === "appointment"
                            ? "var(--wc-purple)"
                            : e.type === "reminder"
                              ? "var(--wc-orange)"
                              : "var(--wc-beauty)",
                      }}
                    />
                    {e.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {view === "list" && (
        <>
          <section className="rounded-wc-lg border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] shadow-wc-xs p-3 sm:p-5">
            <h2 className="text-[18px] font-semibold tracking-tight text-[var(--wc-fg-1)] mb-3">
              {t("calendar")}
            </h2>
            {appointments.isLoading && <ListSkeleton count={4} />}
            {!appointments.isLoading && appsData.length === 0 && (
              <EmptyState
                icon={
                  <Calendar
                    className="h-5 w-5 text-[var(--wc-purple)]"
                    strokeWidth={1.75}
                  />
                }
                title={t("no_events")}
                description={t("no_events_hint")}
              />
            )}
            {!appointments.isLoading &&
              appsData.map((a) => (
                <ListItem
                  key={a.id}
                  title={a.title}
                  subtitle={`${formatDateTime(a.startsAt)}${a.address ? ` · ${a.address}` : ""}`}
                  right={<Badge variant="info">{a.type}</Badge>}
                />
              ))}
          </section>

          <section className="rounded-wc-lg border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] shadow-wc-xs p-3 sm:p-5">
            <h2 className="text-[18px] font-semibold tracking-tight text-[var(--wc-fg-1)] mb-3">
              {t("reminders")}
            </h2>
            {reminders.isLoading && <ListSkeleton count={3} />}
            {!reminders.isLoading && remindersData.length === 0 && (
              <EmptyState
                icon={
                  <Bell
                    className="h-5 w-5 text-[var(--wc-purple)]"
                    strokeWidth={1.75}
                  />
                }
                title={t("no_events")}
              />
            )}
            {!reminders.isLoading &&
              remindersData.map((r) => (
                <ListItem
                  key={r.id}
                  title={r.title}
                  subtitle={formatDateTime(r.triggerDate)}
                  right={<Badge variant="warning">{r.type}</Badge>}
                />
              ))}
          </section>

          <section className="rounded-wc-lg border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] shadow-wc-xs p-3 sm:p-5">
            <h2 className="text-[18px] font-semibold tracking-tight text-[var(--wc-fg-1)] mb-3">
              {t("birthdays")}
            </h2>
            {birthdays.isLoading && <ListSkeleton count={3} />}
            {!birthdays.isLoading && birthdaysData.length === 0 && (
              <EmptyState
                icon={
                  <Cake
                    className="h-5 w-5 text-[var(--wc-purple)]"
                    strokeWidth={1.75}
                  />
                }
                title={t("no_events")}
              />
            )}
            {!birthdays.isLoading &&
              birthdaysData.map((b) => (
                <ListItem
                  key={b.id}
                  title={b.name}
                  subtitle={
                    b.birthday
                      ? new Date(b.birthday).toLocaleDateString("pt-BR")
                      : "—"
                  }
                  right={
                    <Badge variant="success">
                      <Cake className="h-3 w-3" strokeWidth={2} />
                    </Badge>
                  }
                />
              ))}
          </section>
        </>
      )}
    </div>
  );
}
