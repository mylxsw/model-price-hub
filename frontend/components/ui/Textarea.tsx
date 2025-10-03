"use client";

import { forwardRef, TextareaHTMLAttributes } from "react";
import classNames from "classnames";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, className, rows = 4, ...props }, ref) => (
    <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
      {label && <span className="font-medium text-slate-700 dark:text-slate-100">{label}</span>}
      <textarea
        ref={ref}
        rows={rows}
        className={classNames(
          "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
          "resize-y",
          className
        )}
        {...props}
      />
      {helperText && <span className="text-xs text-slate-500 dark:text-slate-400">{helperText}</span>}
    </label>
  )
);

Textarea.displayName = "Textarea";
