"use client";

import { useTranslations } from "next-intl";
import { Bell, Cake, Calendar } from "lucide-react";
import { Badge, Button, EmptyState, ListItem, ListSkeleton } from "@wbc/ui";
import { trpc } from "@/lib/trpc";

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

  const appointments = trpc.schedule.listAppointments.useQuery({});
  const birthdays = trpc.schedule.getUpcomingBirthdays.useQuery({});
  const reminders = trpc.schedule.listReminders.useQuery({});

  const appsData = (appointments.data ?? []) as AppointmentRow[];
  const birthdaysData = (birthdays.data ?? []) as BirthdayRow[];
  const remindersData = (reminders.data ?? []) as ReminderRow[];

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
          {t("title")}
        </h1>
        <Button type="button" size="sm">
          {t("new_appointment")}
        </Button>
      </header>

      <section className="rounded-wc-lg border border-[var(--wc-border)] bg-white shadow-wc-xs p-3 sm:p-5">
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

      <section className="rounded-wc-lg border border-[var(--wc-border)] bg-white shadow-wc-xs p-3 sm:p-5">
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

      <section className="rounded-wc-lg border border-[var(--wc-border)] bg-white shadow-wc-xs p-3 sm:p-5">
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
    </div>
  );
}
