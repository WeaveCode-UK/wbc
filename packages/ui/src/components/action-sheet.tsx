'use client';

import { cn } from '../lib/utils';
import type { ReactNode } from 'react';

interface ActionSheetItem {
  icon?: ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}

interface ActionSheetProps {
  open: boolean;
  onClose: () => void;
  items: ActionSheetItem[];
  className?: string;
}

export function ActionSheet({ open, onClose, items, className }: ActionSheetProps) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <div className={cn('fixed bottom-0 left-0 right-0 z-50 rounded-t-xl bg-[var(--color-bg-primary)] pb-8 transition-transform', className)}>
        <div className="flex justify-center py-3">
          <div className="h-1 w-10 rounded-full bg-[var(--color-border-secondary)]" />
        </div>
        <div className="space-y-1 px-4">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => { item.onClick(); onClose(); }}
              className={cn(
                'flex w-full items-center gap-3 rounded-md px-4 py-3 text-body-small transition-colors hover:bg-[var(--color-bg-secondary)]',
                item.destructive ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-primary)]',
              )}
            >
              {item.icon && <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--color-bg-secondary)] text-lg">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
