"use client";

import classNames from "classnames";

import { usePricingUnit, PricingUnit } from "../../lib/hooks/usePricingUnit";

interface PricingUnitSelectorProps {
  className?: string;
  size?: "sm" | "md";
}

export function PricingUnitSelector({ className, size = "sm" }: PricingUnitSelectorProps) {
  const { selectedUnit, setSelectedUnit } = usePricingUnit();

  const options = [
    { label: "1K Tokens", value: "1K" as PricingUnit },
    { label: "1M Tokens", value: "1M" as PricingUnit },
  ];

  return (
    <label
      className={classNames(
        "flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400",
        className
      )}
    >
      <span>Price Unit</span>
      <select
        value={selectedUnit}
        onChange={(event) => setSelectedUnit(event.target.value as PricingUnit)}
        className={classNames(
          "rounded-md border border-slate-300 bg-white text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
          {
            "px-2 py-1": size === "sm",
            "px-3 py-2 text-sm": size === "md"
          }
        )}
        aria-label="Select pricing unit"
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