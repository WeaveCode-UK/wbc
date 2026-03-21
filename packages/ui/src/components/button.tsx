import { forwardRef } from 'react';
import { cn } from '../lib/utils';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'lg' | 'md' | 'sm' | 'xs';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]',
  secondary: 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-border-tertiary)]',
  outline: 'border border-[var(--color-border-secondary)] bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]',
  ghost: 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]',
  danger: 'bg-[var(--color-danger)] text-white hover:opacity-90',
  success: 'bg-[var(--color-success)] text-white hover:opacity-90',
};

const sizeStyles: Record<ButtonSize, string> = {
  lg: 'h-12 px-6 text-body rounded-md',
  md: 'h-10 px-4 text-body-small rounded-md',
  sm: 'h-8 px-3 text-caption rounded-sm',
  xs: 'h-6 px-2 text-caption rounded-sm',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, children, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 disabled:opacity-50',
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : icon}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';
