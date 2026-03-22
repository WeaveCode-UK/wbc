'use client';

import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

export function ConfirmModal({ open, onClose, onConfirm, title, description, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', destructive }: ConfirmModalProps) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-lg bg-[var(--color-bg-primary)] p-6 shadow-lg space-y-4">
          <h3 className="text-heading-3 text-[var(--color-text-primary)]">{title}</h3>
          {description && <p className="text-body-small text-[var(--color-text-tertiary)]">{description}</p>}
          <div className="flex gap-3 justify-end">
            <button onClick={onClose} className="h-10 px-4 rounded-md text-body-small font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors">
              {cancelLabel}
            </button>
            <button
              onClick={() => { onConfirm(); onClose(); }}
              className={cn(
                'h-10 px-4 rounded-md text-body-small font-medium text-white transition-colors',
                destructive ? 'bg-[var(--color-danger)] hover:opacity-90' : 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]',
              )}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
