import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../lib/utils";
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  togglePassword?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helper,
      className,
      id,
      type = "text",
      togglePassword,
      ...props
    },
    ref,
  ) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    const [revealed, setRevealed] = useState(false);
    const isPassword = type === "password";
    const showToggle = togglePassword && isPassword;
    const effectiveType = showToggle && revealed ? "text" : type;

    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-caption text-[var(--color-text-tertiary)]"
          >
            {label}
          </label>
        )}
        <div className={showToggle ? "relative" : undefined}>
          <input
            ref={ref}
            id={inputId}
            type={effectiveType}
            aria-invalid={error ? true : undefined}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helper
                  ? `${inputId}-helper`
                  : undefined
            }
            className={cn(
              "h-10 w-full rounded-md border bg-[var(--color-bg-primary)] px-3 text-body-small text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] transition-colors",
              error
                ? "border-[var(--color-danger)] focus:ring-2 focus:ring-[var(--color-danger)]"
                : "border-[var(--color-border-secondary)] focus:border-[var(--color-border-primary)] focus:ring-2 focus:ring-[var(--color-primary)]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              showToggle && "pr-10",
              className,
            )}
            {...props}
          />
          {showToggle && (
            <button
              type="button"
              aria-label={revealed ? "Hide password" : "Show password"}
              aria-pressed={revealed}
              aria-controls={inputId}
              onClick={() => setRevealed((v) => !v)}
              className="absolute inset-y-0 right-0 flex min-h-[44px] min-w-[44px] items-center justify-center px-3 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] rounded-md"
            >
              {revealed ? (
                <EyeOff
                  aria-hidden="true"
                  className="h-4 w-4"
                  strokeWidth={1.75}
                />
              ) : (
                <Eye
                  aria-hidden="true"
                  className="h-4 w-4"
                  strokeWidth={1.75}
                />
              )}
            </button>
          )}
        </div>
        <div aria-live="polite" aria-atomic="true">
          {error && (
            <p
              id={`${inputId}-error`}
              role="alert"
              className="text-caption text-[var(--color-danger)]"
            >
              {error}
            </p>
          )}
        </div>
        {helper && !error && (
          <p
            id={`${inputId}-helper`}
            className="text-caption text-[var(--color-text-tertiary)]"
          >
            {helper}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";
