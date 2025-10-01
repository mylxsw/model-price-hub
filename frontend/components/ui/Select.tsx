"use client";

import { forwardRef, SelectHTMLAttributes } from "react";
import classNames from "classnames";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  options: { label: string; value: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, helperText, className, options, ...props }, ref) => (
    <label className="flex flex-col gap-1 text-sm text-slate-300">
      {label && <span className="font-medium text-slate-200">{label}</span>}
      <select
        ref={ref}
        className={classNames("w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm", className)}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helperText && <span className="text-xs text-slate-500">{helperText}</span>}
    </label>
  )
);

Select.displayName = "Select";
