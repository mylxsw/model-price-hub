"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { useModelFilterOptions } from "../../lib/hooks/useModels";
import { useFilterPanelStore } from "../../lib/hooks/useFilterPanel";
import { MODEL_CATEGORIES } from "../../lib/constants";

export interface ModelFilterValues {
  search: string;
  vendorName: string;
  priceModel: string;
  priceCurrency: string;
  capability: string;
  license: string;
  category: string;
}

interface ModelFilterPanelProps {
  values: ModelFilterValues;
  onChange: (values: ModelFilterValues) => void;
  onReset: () => void;
  variant?: "dialog" | "inline";
}

const emptyFilters: ModelFilterValues = {
  search: "",
  vendorName: "",
  priceModel: "",
  priceCurrency: "",
  capability: "",
  license: "",
  category: ""
};

const priceModelOptions = [
  { label: "All pricing", value: "" },
  { label: "Per token", value: "token" },
  { label: "Per call", value: "call" },
  { label: "Tiered", value: "tiered" },
  { label: "Free", value: "free" },
  { label: "Unknown", value: "unknown" }
];

export function ModelFilterPanel({ values, onChange, onReset, variant = "dialog" }: ModelFilterPanelProps) {
  const [localValues, setLocalValues] = useState(values);
  const [pendingReset, setPendingReset] = useState(false);
  const { data: filterOptions, isLoading: optionsLoading } = useModelFilterOptions();
  const inputRef = useRef<HTMLInputElement>(null);
  const { close, registerFocusHandler } = useFilterPanelStore();

  useEffect(() => {
    setLocalValues(values);
    setPendingReset(false);
  }, [values]);

  useEffect(() => {
    if (variant !== "dialog") {
      return undefined;
    }
    registerFocusHandler(() => {
      inputRef.current?.focus();
    });
    return () => registerFocusHandler(null);
  }, [registerFocusHandler, variant]);

  const updateField = <K extends keyof ModelFilterValues>(field: K, value: ModelFilterValues[K]) => {
    setLocalValues((current) => ({ ...current, [field]: value }));
    setPendingReset(false);
  };

  const handleApply = () => {
    if (pendingReset) {
      onReset();
    } else {
      onChange(localValues);
    }
    setPendingReset(false);
    if (variant === "dialog") {
      close();
    }
  };

  const vendorOptions = useMemo(
    () => [
      { label: "All vendors", value: "" },
      ...((filterOptions?.vendors ?? []).map((vendor) => ({ label: vendor, value: vendor })))
    ],
    [filterOptions?.vendors]
  );

  const capabilityOptions = useMemo(
    () => [
      { label: "All capabilities", value: "" },
      ...((filterOptions?.capabilities ?? []).map((capability) => ({ label: capability, value: capability })))
    ],
    [filterOptions?.capabilities]
  );

  const licenseOptions = useMemo(
    () => [
      { label: "All licenses", value: "" },
      ...((filterOptions?.licenses ?? []).map((license) => ({ label: license, value: license })))
    ],
    [filterOptions?.licenses]
  );

  const categoryOptions = useMemo(() => {
    const apiCategories = filterOptions?.categories ?? [];
    const combined = new Set<string>(["", ...MODEL_CATEGORIES.map((item) => item.value), ...apiCategories]);
    return Array.from(combined).map((category, index) =>
      index === 0
        ? { label: "All categories", value: "" }
        : { label: category, value: category }
    );
  }, [filterOptions?.categories]);

  const containerClasses =
    variant === "dialog"
      ? "flex h-full max-h-full w-full flex-col gap-6 rounded-xl border border-slate-200 bg-white/95 p-6 shadow-xl transition dark:border-slate-800 dark:bg-slate-900/80"
      : "flex w-full flex-col gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900";

  const fieldsLayoutClass =
    variant === "dialog"
      ? "flex flex-col gap-4"
      : "grid gap-4 sm:grid-cols-2 xl:grid-cols-3";

  const searchFieldClass = variant === "dialog" ? "" : "w-full sm:max-w-md xl:max-w-lg";

  const actionContainerClass =
    variant === "dialog"
      ? "mt-auto flex flex-col gap-3 sm:flex-row"
      : "pt-2 flex flex-col gap-3 sm:flex-row sm:justify-end";

  const actionButtonClass = variant === "dialog" ? "w-full sm:flex-1" : "w-full sm:w-auto";

  return (
    <aside className={containerClasses}>
      <div className={fieldsLayoutClass}>
        <div className={searchFieldClass}>
          <Input
            ref={inputRef}
            label="Search"
            placeholder="Model or vendor"
            value={localValues.search}
            onChange={(event) => updateField("search", event.target.value)}
          />
        </div>
        <div>
          <Select
            label="Vendor"
            value={localValues.vendorName}
            onChange={(event) => updateField("vendorName", event.target.value)}
            options={vendorOptions}
            disabled={optionsLoading}
          />
        </div>
        <div>
          <Select
            label="Capability"
            value={localValues.capability}
            onChange={(event) => updateField("capability", event.target.value)}
            options={capabilityOptions}
            disabled={optionsLoading}
          />
        </div>
        <div>
          <Select
            label="License"
            value={localValues.license}
            onChange={(event) => updateField("license", event.target.value)}
            options={licenseOptions}
            disabled={optionsLoading}
          />
        </div>
        <div>
          <Select
            label="Category"
            value={localValues.category}
            onChange={(event) => updateField("category", event.target.value)}
            options={categoryOptions}
            disabled={optionsLoading}
          />
        </div>
        <div>
          <Select
            label="Pricing model"
            value={localValues.priceModel}
            onChange={(event) => updateField("priceModel", event.target.value)}
            options={priceModelOptions}
          />
        </div>
      </div>
      <div className={actionContainerClass}>
        <Button
          variant="secondary"
          onClick={() => {
            setLocalValues({ ...emptyFilters });
            setPendingReset(true);
          }}
          className={actionButtonClass}
        >
          Reset filters
        </Button>
        <Button onClick={handleApply} className={actionButtonClass}>
          Apply
        </Button>
      </div>
    </aside>
  );
}
