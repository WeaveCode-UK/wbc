'use client';

import { cn } from '../lib/utils';

interface SegmentedControlProps {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SegmentedControl({ options, value, onChange, className }: SegmentedControlProps) {
  return (
    <div className={cn('flex rounded-md bg-[var(--color-bg-secondary)] p-0.5', className)}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'flex-1 rounded-sm px-3 py-1.5 text-caption font-medium transition-all duration-200',
            value === option.value
              ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] shadow-sm'
              : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
