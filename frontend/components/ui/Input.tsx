"use client";

import { forwardRef, InputHTMLAttributes } from "react";
import classNames from "classnames";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, className, ...props }, ref) => (
    <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
      {label && <span className="font-medium text-slate-700 dark:text-slate-100">{label}</span>}
      <input
        ref={ref}
        className={classNames(
          "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
          className
        )}
        {...props}
      />
      {helperText && <span className="text-xs text-slate-500 dark:text-slate-400">{helperText}</span>}
    </label>
  )
);

Input.displayName = "Input";
