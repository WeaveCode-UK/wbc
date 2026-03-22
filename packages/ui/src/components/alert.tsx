import { cn } from '../lib/utils';
import type { ReactNode } from 'react';

type AlertVariant = 'ia' | 'success' | 'warning' | 'danger';

interface AlertProps {
  variant?: AlertVariant;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<AlertVariant, string> = {
  ia: 'bg-[var(--color-primary-surface)] text-[var(--color-primary)]',
  success: 'bg-[var(--color-success-bg)] text-[var(--color-success-text)]',
  warning: 'bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]',
  danger: 'bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]',
};

export function Alert({ variant = 'ia', icon, children, className }: AlertProps) {
  return (
    <div className={cn('flex items-start gap-3 rounded-md px-3 py-2.5', variantStyles[variant], className)}>
      {icon && <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-lg">{icon}</div>}
      <div className="flex-1 text-body-small">{children}</div>
    </div>
  );
}
