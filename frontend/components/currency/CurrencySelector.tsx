"use client";

import classNames from "classnames";
import { useMemo } from "react";

import { useCurrency } from "../../lib/hooks/useCurrency";

interface CurrencySelectorProps {
  className?: string;
  size?: "sm" | "md";
}

export function CurrencySelector({ className, size = "sm" }: CurrencySelectorProps) {
  const { availableCurrencies, selectedCurrency, setSelectedCurrency, isLoading } = useCurrency();

  const options = useMemo(() => {
    return availableCurrencies.map((code) => ({ label: code, value: code }));
  }, [availableCurrencies]);

  if (!options.length) {
    return null;
  }

  return (
    <label
      className={classNames(
        "flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400",
        className
      )}
    >
      <span>Currency</span>
      <select
        value={selectedCurrency}
        onChange={(event) => setSelectedCurrency(event.target.value)}
        disabled={isLoading}
        className={classNames(
          "rounded-md border border-slate-300 bg-white text-xs uppercase tracking-wide text-slate-600 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
          {
            "px-2 py-1": size === "sm",
            "px-3 py-2 text-sm": size === "md"
          }
        )}
        aria-label="Select currency"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
