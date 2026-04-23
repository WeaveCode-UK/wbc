import { cn } from "../lib/utils";

interface ListSkeletonProps {
  count?: number;
  variant?: "list" | "card";
  className?: string;
}

// ACH-006: Reusable skeleton for loading lists.
// Pair with <Suspense> boundaries or local loading state.
export function ListSkeleton({
  count = 6,
  variant = "list",
  className,
}: ListSkeletonProps) {
  const base =
    variant === "card"
      ? "h-28 rounded-lg bg-[var(--color-bg-secondary)] animate-pulse"
      : "h-16 rounded-md bg-[var(--color-bg-secondary)] animate-pulse";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading"
      className={cn("space-y-3", className)}
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={base} />
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}
