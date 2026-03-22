import { cn } from '../lib/utils';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export function Skeleton({ className, width, height }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-[var(--color-bg-secondary)]', className)}
      style={{ width, height }}
    />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-4 space-y-3', className)}>
      <Skeleton height="12px" width="60%" />
      <Skeleton height="24px" width="40%" />
      <Skeleton height="10px" width="80%" />
    </div>
  );
}

export function SkeletonListItem() {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <Skeleton className="h-9 w-9 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton height="12px" width="50%" />
        <Skeleton height="10px" width="30%" />
      </div>
    </div>
  );
}
