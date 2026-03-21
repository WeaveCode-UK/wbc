import { cn } from '../lib/utils';
import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'flat' | 'action';
  accentColor?: string;
  children: ReactNode;
}

export function Card({ variant = 'elevated', accentColor, children, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg p-4',
        variant === 'elevated' && 'bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)]',
        variant === 'flat' && 'bg-[var(--color-bg-secondary)]',
        variant === 'action' && 'bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)]',
        className,
      )}
      style={variant === 'action' && accentColor ? { borderLeftWidth: '3px', borderLeftColor: accentColor } : undefined}
      {...props}
    >
      {children}
    </div>
  );
}

export function MetricCard({ label, value, change, className }: { label: string; value: string; change?: string; className?: string }) {
  return (
    <Card variant="flat" className={cn('space-y-1', className)}>
      <p className="text-caption text-[var(--color-text-tertiary)]">{label}</p>
      <p className="text-heading-2 text-[var(--color-text-primary)] font-medium" style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</p>
      {change && <p className="text-caption text-[var(--color-success)]">{change}</p>}
    </Card>
  );
}
