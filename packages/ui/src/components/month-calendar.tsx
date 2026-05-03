"use client";

import { cn } from "../lib/utils";
import type { ReactNode } from "react";

// Bloco 8 do plano: feature #47 — tela de oportunidades em calendário.
// Componente custom (sem react-day-picker / date-fns) usando Date nativo
// + grade Tailwind 7×6.

export interface MonthCalendarEvent {
  date: Date;
  type: "appointment" | "reminder" | "birthday" | string;
  label: string;
}

interface MonthCalendarProps {
  month: Date; // any date inside the month to render
  events?: MonthCalendarEvent[];
  weekStartsOn?: 0 | 1; // 0=domingo, 1=segunda. Default segunda.
  onMonthChange?: (next: Date) => void;
  onDayClick?: (day: Date, events: MonthCalendarEvent[]) => void;
  className?: string;
  renderHeader?: (label: string) => ReactNode;
}

const WEEKDAY_LABELS_PT = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];
const MONTH_LABELS_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const TYPE_COLORS: Record<string, string> = {
  appointment: "var(--wc-purple)",
  reminder: "var(--wc-orange)",
  birthday: "var(--wc-beauty)",
};

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function MonthCalendar({
  month,
  events = [],
  weekStartsOn = 1,
  onMonthChange,
  onDayClick,
  className,
  renderHeader,
}: MonthCalendarProps) {
  const first = startOfMonth(month);
  // Quantos dias vazios antes do dia 1: ajustar conforme weekStartsOn.
  const firstWeekday = first.getDay(); // 0=dom, 6=sáb
  const offset = (firstWeekday - weekStartsOn + 7) % 7;

  // Datas a renderizar: 6 linhas × 7 colunas = 42 células sempre.
  const cells: Date[] = [];
  const start = new Date(first);
  start.setDate(first.getDate() - offset);
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push(d);
  }

  const monthLabel = `${MONTH_LABELS_PT[month.getMonth()]} ${month.getFullYear()}`;
  const today = new Date();

  const eventsByDay = new Map<string, MonthCalendarEvent[]>();
  for (const ev of events) {
    const key = `${ev.date.getFullYear()}-${ev.date.getMonth()}-${ev.date.getDate()}`;
    const arr = eventsByDay.get(key) ?? [];
    arr.push(ev);
    eventsByDay.set(key, arr);
  }

  const goPrev = () => {
    if (!onMonthChange) return;
    onMonthChange(new Date(first.getFullYear(), first.getMonth() - 1, 1));
  };
  const goNext = () => {
    if (!onMonthChange) return;
    onMonthChange(new Date(first.getFullYear(), first.getMonth() + 1, 1));
  };

  const weekdayLabels =
    weekStartsOn === 1
      ? WEEKDAY_LABELS_PT
      : [...WEEKDAY_LABELS_PT.slice(6), ...WEEKDAY_LABELS_PT.slice(0, 6)];

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        {renderHeader ? (
          renderHeader(monthLabel)
        ) : (
          <h3 className="text-[18px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
            {monthLabel}
          </h3>
        )}
        {onMonthChange && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Mês anterior"
              onClick={goPrev}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--wc-fg-2)] hover:bg-[var(--wc-bg-muted)]"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Próximo mês"
              onClick={goNext}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--wc-fg-2)] hover:bg-[var(--wc-bg-muted)]"
            >
              ›
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {weekdayLabels.map((label) => (
          <div
            key={label}
            className="text-[11px] font-medium text-[var(--wc-fg-3)] uppercase py-1"
          >
            {label}
          </div>
        ))}
        {cells.map((day, idx) => {
          const isCurrentMonth = day.getMonth() === month.getMonth();
          const isToday = isSameDay(day, today);
          const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
          const dayEvents = eventsByDay.get(key) ?? [];
          const Component = onDayClick ? "button" : "div";
          return (
            <Component
              key={idx}
              {...(onDayClick
                ? {
                    type: "button" as const,
                    onClick: () => onDayClick(day, dayEvents),
                  }
                : {})}
              aria-label={`${day.getDate()} — ${dayEvents.length} eventos`}
              className={cn(
                "relative aspect-square flex flex-col items-center justify-start p-1 rounded-md text-[12px] transition-colors",
                isCurrentMonth
                  ? "text-[var(--wc-fg-1)]"
                  : "text-[var(--wc-fg-3)] opacity-60",
                isToday && "ring-2 ring-[var(--wc-purple)]",
                onDayClick && "hover:bg-[var(--wc-bg-muted)] cursor-pointer",
              )}
            >
              <span className="leading-none mt-0.5">{day.getDate()}</span>
              {dayEvents.length > 0 && (
                <div className="mt-auto mb-1 flex gap-0.5 justify-center">
                  {dayEvents.slice(0, 3).map((ev, i) => (
                    <span
                      key={i}
                      aria-hidden="true"
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        background:
                          TYPE_COLORS[ev.type] ?? "var(--wc-fg-muted)",
                      }}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[9px] text-[var(--wc-fg-3)]">
                      +{dayEvents.length - 3}
                    </span>
                  )}
                </div>
              )}
            </Component>
          );
        })}
      </div>
    </div>
  );
}
