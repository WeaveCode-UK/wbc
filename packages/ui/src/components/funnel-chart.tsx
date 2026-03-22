import { cn } from '../lib/utils';

interface FunnelStep {
  label: string;
  value: number;
  color: string;
}

interface FunnelChartProps {
  steps: FunnelStep[];
  className?: string;
}

export function FunnelChart({ steps, className }: FunnelChartProps) {
  const maxValue = Math.max(...steps.map((s) => s.value), 1);

  return (
    <div className={cn('space-y-2', className)}>
      {steps.map((step, i) => {
        const widthPercent = (step.value / maxValue) * 100;
        return (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-caption text-[var(--color-text-secondary)]">{step.label}</span>
              <span className="text-caption font-medium text-[var(--color-text-primary)]" style={{ fontVariantNumeric: 'tabular-nums' }}>{step.value}</span>
            </div>
            <div className="h-5 w-full overflow-hidden rounded bg-[var(--color-bg-secondary)]">
              <div className="h-full rounded transition-all duration-500" style={{ width: `${widthPercent}%`, backgroundColor: step.color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
