import { cn } from '../lib/utils';
import type { ReactNode } from 'react';

interface ListItemProps {
  avatar?: ReactNode;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  separator?: boolean;
  onClick?: () => void;
  className?: string;
}

export function ListItem({ avatar, title, subtitle, right, separator = true, onClick, className }: ListItemProps) {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 py-2.5',
        separator && 'border-b border-[var(--color-border-tertiary)]',
        onClick && 'w-full text-left hover:bg-[var(--color-bg-secondary)] rounded-md px-2 -mx-2 transition-colors',
        className,
      )}
    >
      {avatar && <div className="shrink-0">{avatar}</div>}
      <div className="flex-1 min-w-0">
        <p className="text-body-small font-medium text-[var(--color-text-primary)] truncate">{title}</p>
        {subtitle && <p className="text-caption text-[var(--color-text-tertiary)] truncate">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </Wrapper>
  );
}
