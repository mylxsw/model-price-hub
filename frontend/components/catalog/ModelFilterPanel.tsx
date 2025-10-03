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
}

const priceModelOptions = [
  { label: "All pricing", value: "" },
  { label: "Per token", value: "token" },
  { label: "Per call", value: "call" },
  { label: "Tiered", value: "tiered" },
  { label: "Free", value: "free" },
  { label: "Unknown", value: "unknown" }
];

export function ModelFilterPanel({ values, onChange, onReset }: ModelFilterPanelProps) {
  const [localValues, setLocalValues] = useState(values);
  const { data: filterOptions, isLoading: optionsLoading } = useModelFilterOptions();
  const inputRef = useRef<HTMLInputElement>(null);
  const { close, registerFocusHandler } = useFilterPanelStore();

  useEffect(() => {
    setLocalValues(values);
  }, [values]);

  useEffect(() => {
    registerFocusHandler(() => {
      inputRef.current?.focus();
    });
    return () => registerFocusHandler(null);
  }, [registerFocusHandler]);

  const updateField = <K extends keyof ModelFilterValues>(field: K, value: ModelFilterValues[K]) => {
    const updated = { ...localValues, [field]: value };
    setLocalValues(updated);
    onChange(updated);
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

  return (
    <aside className="flex h-full max-h-full w-full flex-col gap-6 rounded-xl border border-slate-200 bg-white/95 p-6 shadow-xl transition dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-100">Refine results</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Search, filter, and tailor the catalog to your needs.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={close} aria-label="Close filters" className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
          ×
        </Button>
      </div>
      <Input
        ref={inputRef}
        label="Search"
        placeholder="Model or vendor"
        value={localValues.search}
        onChange={(event) => updateField("search", event.target.value)}
      />
      <Select
        label="Vendor"
        value={localValues.vendorName}
        onChange={(event) => updateField("vendorName", event.target.value)}
        options={vendorOptions}
        disabled={optionsLoading}
      />
      <Select
        label="Capability"
        value={localValues.capability}
        onChange={(event) => updateField("capability", event.target.value)}
        options={capabilityOptions}
        disabled={optionsLoading}
      />
      <Select
        label="License"
        value={localValues.license}
        onChange={(event) => updateField("license", event.target.value)}
        options={licenseOptions}
        disabled={optionsLoading}
      />
      <Select
        label="Category"
        value={localValues.category}
        onChange={(event) => updateField("category", event.target.value)}
        options={categoryOptions}
        disabled={optionsLoading}
      />
      <Select
        label="Pricing model"
        value={localValues.priceModel}
        onChange={(event) => updateField("priceModel", event.target.value)}
        options={priceModelOptions}
      />
      <div className="mt-auto flex flex-col gap-3 sm:flex-row">
        <Button variant="secondary" onClick={onReset} className="w-full sm:flex-1">
          Reset filters
        </Button>
        <Button onClick={close} className="w-full sm:flex-1">
          Apply
        </Button>
      </div>
    </aside>
  );
}
