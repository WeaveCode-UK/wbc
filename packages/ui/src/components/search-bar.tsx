import { cn } from '../lib/utils';
import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface SearchBarProps extends InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, onClear, value, ...props }, ref) => {
    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">
          🔍
        </span>
        <input
          ref={ref}
          value={value}
          className={cn(
            'h-[38px] w-full rounded-md bg-[var(--color-bg-secondary)] pl-9 pr-8 text-body-small text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]',
            className,
          )}
          {...props}
        />
        {value && onClear && (
          <button onClick={onClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]">
            ×
          </button>
        )}
      </div>
    );
  },
);
SearchBar.displayName = 'SearchBar';
