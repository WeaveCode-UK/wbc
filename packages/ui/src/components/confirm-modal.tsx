"use client";

import { useCallback, useEffect, useRef } from "react";
import { cn } from "../lib/utils";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  isLoading?: boolean;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive,
  isLoading = false,
}: ConfirmModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      queueMicrotask(() => confirmBtnRef.current?.focus());
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Explicit focus-trap: cycle Tab between confirm and cancel.
  // Native <dialog>.showModal() already traps focus inside the dialog,
  // but we pin the cycle to the two actionable buttons for predictability.
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDialogElement>) => {
      if (e.key !== "Tab") return;
      const active = document.activeElement;
      const confirm = confirmBtnRef.current;
      const cancel = cancelBtnRef.current;
      if (!confirm || !cancel) return;
      if (e.shiftKey) {
        if (active === cancel) {
          e.preventDefault();
          confirm.focus();
        } else if (active === confirm) {
          e.preventDefault();
          cancel.focus();
        }
      } else {
        if (active === confirm) {
          e.preventDefault();
          cancel.focus();
        } else if (active === cancel) {
          e.preventDefault();
          confirm.focus();
        }
      }
    },
    [],
  );

  const handleConfirm = () => {
    if (isLoading) return;
    onConfirm();
    // Loading caller controls when to close via `open` prop.
    // When not loading, close immediately after trigger.
    if (!isLoading) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onKeyDown={handleKeyDown}
      aria-labelledby="confirm-modal-title"
      aria-describedby={description ? "confirm-modal-description" : undefined}
      aria-busy={isLoading}
      className="fixed z-50 w-full max-w-sm rounded-lg bg-[var(--color-bg-primary)] p-6 shadow-lg backdrop:bg-black/40"
    >
      <div className="space-y-4">
        <h3
          id="confirm-modal-title"
          className="text-heading-3 text-[var(--color-text-primary)]"
        >
          {title}
        </h3>
        {description && (
          <p
            id="confirm-modal-description"
            className="text-body-small text-[var(--color-text-tertiary)]"
          >
            {description}
          </p>
        )}
        <div className="flex gap-3 justify-end">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="h-10 px-4 rounded-md text-body-small font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            autoFocus
            onClick={handleConfirm}
            disabled={isLoading}
            aria-busy={isLoading}
            className={cn(
              "h-10 px-4 rounded-md text-body-small font-medium text-white transition-colors inline-flex items-center justify-center gap-2",
              destructive
                ? "bg-[var(--color-danger)] hover:opacity-90"
                : "bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]",
              "disabled:opacity-70 disabled:cursor-not-allowed",
            )}
          >
            {isLoading && (
              <span
                aria-hidden="true"
                className="inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
              />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
