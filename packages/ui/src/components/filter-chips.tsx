'use client';

import { cn } from '../lib/utils';

interface Chip {
  label: string;
  value: string;
  color?: string;
  count?: number;
}

interface FilterChipsProps {
  chips: Chip[];
  selected: string | null;
  onChange: (value: string | null) => void;
  className?: string;
}

export function FilterChips({ chips, selected, onChange, className }: FilterChipsProps) {
  return (
    <div className={cn('flex gap-2 overflow-x-auto pb-1 scrollbar-none', className)}>
      {chips.map((chip) => (
        <button
          key={chip.value}
          onClick={() => onChange(selected === chip.value ? null : chip.value)}
          className={cn(
            'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-caption font-medium transition-colors',
            selected === chip.value
              ? 'border-[var(--color-primary)] bg-[var(--color-primary-surface)] text-[var(--color-primary)]'
              : 'border-[var(--color-border-secondary)] bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]',
          )}
        >
          {chip.color && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: chip.color }} />}
          {chip.label}
          {chip.count !== undefined && <span className="text-[var(--color-text-tertiary)]">{chip.count}</span>}
        </button>
      ))}
    </div>
  );
}
