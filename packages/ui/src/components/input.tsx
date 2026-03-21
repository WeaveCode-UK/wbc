import { forwardRef } from 'react';
import { cn } from '../lib/utils';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-caption text-[var(--color-text-tertiary)]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'h-10 w-full rounded-md border bg-[var(--color-bg-primary)] px-3 text-body-small text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] transition-colors',
            error
              ? 'border-[var(--color-danger)] focus:ring-2 focus:ring-[var(--color-danger)]'
              : 'border-[var(--color-border-secondary)] focus:border-[var(--color-border-primary)] focus:ring-2 focus:ring-[var(--color-primary)]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className,
          )}
          {...props}
        />
        {error && <p className="text-caption text-[var(--color-danger)]">{error}</p>}
        {helper && !error && <p className="text-caption text-[var(--color-text-tertiary)]">{helper}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';
