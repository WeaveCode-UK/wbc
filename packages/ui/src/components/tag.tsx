import { cn } from '../lib/utils';

interface TagProps {
  label: string;
  color?: string;
  onRemove?: () => void;
  className?: string;
}

export function Tag({ label, color, onRemove, className }: TagProps) {
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-caption', className)}
      style={{ backgroundColor: color ? `${color}20` : 'var(--color-bg-secondary)', color: color ?? 'var(--color-text-secondary)' }}
    >
      {label}
      {onRemove && (
        <button onClick={onRemove} className="ml-0.5 hover:opacity-70" aria-label={`Remove ${label}`}>
          ×
        </button>
      )}
    </span>
  );
}
