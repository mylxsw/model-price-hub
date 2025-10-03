"use client";

import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import classNames from "classnames";

export type ToastVariant = "success" | "error" | "info";

interface ShowToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastRecord extends Required<ShowToastOptions> {
  id: string;
  createdAt: number;
}

interface ToastContextValue {
  showToast: (options: ShowToastOptions) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const variantStyles: Record<ToastVariant, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-900/50 dark:text-emerald-200",
  error: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-rose-900/50 dark:text-rose-200",
  info: "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
};

const DEFAULT_DURATION = 4000;

const createId = () => `toast-${Math.random().toString(36).slice(2)}-${Date.now()}`;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((options: ShowToastOptions) => {
    const { title, description = "", variant = "info", duration = DEFAULT_DURATION } = options;
    if (!title.trim() && !description.trim()) {
      return;
    }
    const id = createId();
    const toast: ToastRecord = {
      id,
      title,
      description,
      variant,
      duration,
      createdAt: Date.now()
    };
    setToasts((current) => [...current, toast]);

    if (Number.isFinite(duration) && duration > 0) {
      window.setTimeout(() => {
        dismissToast(id);
      }, duration);
    }
  }, [dismissToast]);

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-full max-w-sm flex-col gap-3 sm:right-6 sm:top-6">
        {toasts.map((toast) => (
          <div
            key={`${toast.id}-${toast.createdAt}`}
            role="status"
            aria-live="polite"
            className={classNames(
              "pointer-events-auto overflow-hidden rounded-lg border px-4 py-3 shadow-lg ring-1 ring-black/5",
              variantStyles[toast.variant]
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-1">
                {toast.title && <p className="text-sm font-semibold">{toast.title}</p>}
                {toast.description && <p className="text-xs leading-relaxed opacity-80">{toast.description}</p>}
              </div>
              <button
                type="button"
                aria-label="Dismiss notification"
                className="text-sm font-semibold text-slate-400 transition hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                onClick={() => dismissToast(toast.id)}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
