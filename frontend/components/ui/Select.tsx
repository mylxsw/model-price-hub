import { forwardRef, SelectHTMLAttributes } from "react";
import classNames from "classnames";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  options: { label: string; value: string }[];
  fieldSize?: "sm" | "md";
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, helperText, className, options, fieldSize = "md", ...props }, ref) => (
    <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
      {label && <span className="font-medium text-slate-700 dark:text-slate-100">{label}</span>}
      <select
        ref={ref}
        className={classNames(
          "w-full rounded-md border border-slate-300 bg-white text-slate-700 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
          fieldSize === "sm" ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm",
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helperText && <span className="text-xs text-slate-500 dark:text-slate-400">{helperText}</span>}
    </label>
  )
);

Select.displayName = "Select";
