import { cn } from '../lib/utils';
import type { ReactNode } from 'react';

interface TimelineEvent {
  color: string;
  title: string;
  description?: string;
  time?: string;
  icon?: ReactNode;
}

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export function Timeline({ events, className }: TimelineProps) {
  return (
    <div className={cn('relative pl-5', className)}>
      <div className="absolute left-[3px] top-2 bottom-2 w-px bg-[var(--color-border-tertiary)]" />
      <div className="space-y-4">
        {events.map((event, i) => (
          <div key={i} className="relative flex gap-3">
            <div className="absolute -left-5 top-1.5 h-2 w-2 rounded-full" style={{ backgroundColor: event.color }} />
            <div className="flex-1">
              <p className="text-body-small font-medium text-[var(--color-text-primary)]">{event.title}</p>
              {event.description && <p className="text-caption text-[var(--color-text-tertiary)]">{event.description}</p>}
              {event.time && <p className="text-caption text-[var(--color-text-tertiary)] mt-0.5">{event.time}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
