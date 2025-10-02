"use client";

import { useEffect, useState } from "react";

import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";

export interface ModelFilterValues {
  search: string;
  vendorName: string;
  priceModel: string;
  priceCurrency: string;
  capability: string;
  license: string;
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
  { label: "Tiered", value: "tiered" }
];

const currencyOptions = [
  { label: "All currencies", value: "" },
  { label: "USD", value: "USD" },
  { label: "CNY", value: "CNY" }
];

export function ModelFilterPanel({ values, onChange, onReset }: ModelFilterPanelProps) {
  const [localValues, setLocalValues] = useState(values);

  useEffect(() => {
    setLocalValues(values);
  }, [values]);

  const updateField = <K extends keyof ModelFilterValues>(field: K, value: ModelFilterValues[K]) => {
    const updated = { ...localValues, [field]: value };
    setLocalValues(updated);
    onChange(updated);
  };

  return (
    <aside className="w-full space-y-6 rounded-xl border border-slate-800 bg-slate-900/70 p-6 lg:w-80">
      <Input
        label="Search"
        placeholder="Model or vendor"
        value={localValues.search}
        onChange={(event) => updateField("search", event.target.value)}
      />
      <Input
        label="Vendor"
        placeholder="Vendor name"
        value={localValues.vendorName}
        onChange={(event) => updateField("vendorName", event.target.value)}
      />
      <Input
        label="Capability"
        placeholder="e.g. chat"
        value={localValues.capability}
        onChange={(event) => updateField("capability", event.target.value)}
      />
      <Input
        label="License"
        placeholder="e.g. commercial"
        value={localValues.license}
        onChange={(event) => updateField("license", event.target.value)}
      />
      <Select
        label="Pricing model"
        value={localValues.priceModel}
        onChange={(event) => updateField("priceModel", event.target.value)}
        options={priceModelOptions}
      />
      <Select
        label="Currency"
        value={localValues.priceCurrency}
        onChange={(event) => updateField("priceCurrency", event.target.value)}
        options={currencyOptions}
      />
      <Button variant="secondary" onClick={onReset} className="w-full">
        Reset filters
      </Button>
    </aside>
  );
}
