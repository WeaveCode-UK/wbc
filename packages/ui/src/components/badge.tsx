import { cn } from '../lib/utils';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  children: string;
  className?: string;
}

const badgeStyles: Record<BadgeVariant, string> = {
  success: 'bg-[var(--color-success-bg)] text-[var(--color-success-text)]',
  warning: 'bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]',
  danger: 'bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]',
  info: 'bg-[var(--color-info-bg)] text-[var(--color-info-text)]',
  neutral: 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]',
};

export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center rounded-sm px-2 py-0.5 text-caption font-medium', badgeStyles[variant], className)}>
      {children}
    </span>
  );
}
