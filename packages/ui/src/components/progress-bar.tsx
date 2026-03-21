import { cn } from '../lib/utils';

type ProgressVariant = 'primary' | 'success' | 'warning' | 'danger';

interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: ProgressVariant;
  showLabel?: boolean;
  className?: string;
}

const variantColors: Record<ProgressVariant, string> = {
  primary: 'var(--color-primary)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-danger)',
};

export function ProgressBar({ value, max = 100, variant = 'primary', showLabel, className }: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn('space-y-1', className)}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-bg-secondary)]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: variantColors[variant] }}
        />
      </div>
      {showLabel && <p className="text-caption text-[var(--color-text-tertiary)]">{Math.round(percentage)}%</p>}
    </div>
  );
}
