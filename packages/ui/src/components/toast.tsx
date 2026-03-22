'use client';

import { useEffect, useState } from 'react';
import { cn } from '../lib/utils';

type ToastVariant = 'success' | 'info' | 'warning' | 'danger';

interface ToastProps {
  variant?: ToastVariant;
  message: string;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
}

const icons: Record<ToastVariant, string> = { success: '✓', info: 'ℹ', warning: '⚠', danger: '✕' };
const variantStyles: Record<ToastVariant, string> = {
  success: 'bg-[var(--color-success)] text-white',
  info: 'bg-[var(--color-info)] text-white',
  warning: 'bg-[var(--color-warning)] text-white',
  danger: 'bg-[var(--color-danger)] text-white',
};

export function Toast({ variant = 'info', message, visible, onDismiss, duration }: ToastProps) {
  const [show, setShow] = useState(false);
  const autoClose = duration ?? (variant === 'danger' || variant === 'warning' ? 5000 : 3000);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => { setShow(false); setTimeout(onDismiss, 300); }, autoClose);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [visible, autoClose, onDismiss]);

  if (!visible && !show) return null;

  return (
    <div className={cn(
      'fixed top-4 left-1/2 z-[100] -translate-x-1/2 flex items-center gap-2 rounded-md px-4 py-2.5 shadow-lg transition-all duration-300',
      variantStyles[variant],
      show ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0',
    )}>
      <span className="text-lg">{icons[variant]}</span>
      <span className="text-body-small font-medium">{message}</span>
      <button onClick={() => { setShow(false); setTimeout(onDismiss, 300); }} className="ml-2 opacity-70 hover:opacity-100">✕</button>
    </div>
  );
}
