"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { Toast } from "@wbc/ui";

// F11.E20.5: lightweight toast context. The @wbc/ui Toast renders one
// notification at a time; the provider keeps a single visible toast and
// auto-dismisses after `duration` ms. Multiple rapid calls replace the
// current message (last-write-wins) — fine for mutation feedback.

type ToastVariant = "success" | "info" | "warning" | "danger";

interface ToastState {
  message: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastContextValue {
  show: (input: {
    message: string;
    variant?: ToastVariant;
    duration?: number;
  }) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ToastState | null>(null);

  const show = useCallback<ToastContextValue["show"]>((input) => {
    setState({
      message: input.message,
      variant: input.variant ?? "info",
      duration: input.duration ?? 3000,
    });
  }, []);

  const success = useCallback(
    (message: string) => show({ message, variant: "success" }),
    [show],
  );
  const error = useCallback(
    (message: string) => show({ message, variant: "danger", duration: 5000 }),
    [show],
  );

  return (
    <ToastContext.Provider value={{ show, success, error }}>
      {children}
      {state && (
        <Toast
          variant={state.variant}
          message={state.message}
          visible={true}
          duration={state.duration}
          onDismiss={() => setState(null)}
        />
      )}
    </ToastContext.Provider>
  );
}
