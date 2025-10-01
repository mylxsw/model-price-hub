"use client";

import { forwardRef, InputHTMLAttributes } from "react";
import classNames from "classnames";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, className, ...props }, ref) => (
    <label className="flex flex-col gap-1 text-sm text-slate-300">
      {label && <span className="font-medium text-slate-200">{label}</span>}
      <input ref={ref} className={classNames("w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm", className)} {...props} />
      {helperText && <span className="text-xs text-slate-500">{helperText}</span>}
    </label>
  )
);

Input.displayName = "Input";
