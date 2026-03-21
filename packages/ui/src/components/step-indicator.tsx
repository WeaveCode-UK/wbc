import { cn } from '../lib/utils';

interface StepIndicatorProps {
  total: number;
  current: number;
  className?: string;
}

export function StepIndicator({ total, current, className }: StepIndicatorProps) {
  return (
    <div className={cn('flex items-center justify-center gap-1.5', className)}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn(
            'h-[3px] rounded-full transition-all duration-300',
            i === current ? 'w-9 bg-[var(--color-primary)]' : 'w-6 bg-[var(--color-border-secondary)]',
          )}
        />
      ))}
    </div>
  );
}
