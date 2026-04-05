'use client';

import { useEffect, useRef } from 'react';
import { cn } from '../lib/utils';

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
}

export function ConfirmModal({ open, onClose, onConfirm, title, description, confirmLabel, cancelLabel, destructive }: ConfirmModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="confirm-modal-title"
      className="fixed z-50 w-full max-w-sm rounded-lg bg-[var(--color-bg-primary)] p-6 shadow-lg backdrop:bg-black/40"
    >
      <div className="space-y-4">
        <h3 id="confirm-modal-title" className="text-heading-3 text-[var(--color-text-primary)]">{title}</h3>
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
    </dialog>
  );
}
