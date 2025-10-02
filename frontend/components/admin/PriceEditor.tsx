"use client";

import { Fragment } from "react";

import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

type PriceData = Record<string, unknown> | null | undefined;

interface PriceEditorProps {
  priceModel?: string | null;
  value: PriceData;
  onChange: (nextValue: Record<string, unknown> | null) => void;
}

const toNumberOrNull = (value: string) => {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const ensureRecord = (maybeRecord: unknown): Record<string, unknown> => {
  return maybeRecord && typeof maybeRecord === "object" ? (maybeRecord as Record<string, unknown>) : {};
};

function renderTokenPricing(value: PriceData, onChange: (nextValue: Record<string, unknown> | null) => void) {
  const baseRaw = ensureRecord(ensureRecord(value).base);
  const base = {
    input_token_1m: baseRaw.input_token_1m ?? null,
    output_token_1m: baseRaw.output_token_1m ?? null,
    input_token_cached_1m: baseRaw.input_token_cached_1m ?? null
  };

  const handleUpdate = (field: keyof typeof base, raw: string) => {
    const nextBase = { ...base, [field]: toNumberOrNull(raw) };
    onChange({ base: nextBase });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Input
        label="Input tokens (per 1M)"
        type="number"
        min={0}
        step="0.0001"
        value={base.input_token_1m ?? ""}
        onChange={(event) => handleUpdate("input_token_1m", event.target.value)}
      />
      <Input
        label="Input tokens (cached, per 1M)"
        type="number"
        min={0}
        step="0.0001"
        value={base.input_token_cached_1m ?? ""}
        onChange={(event) => handleUpdate("input_token_cached_1m", event.target.value)}
      />
      <Input
        label="Output tokens (per 1M)"
        type="number"
        min={0}
        step="0.0001"
        value={base.output_token_1m ?? ""}
        onChange={(event) => handleUpdate("output_token_1m", event.target.value)}
      />
    </div>
  );
}

function renderCallPricing(value: PriceData, onChange: (nextValue: Record<string, unknown> | null) => void) {
  const base = ensureRecord(ensureRecord(value).base);
  const handleUpdate = (field: string, raw: string) => {
    const nextValue = field === "included_calls" ? (raw.trim() ? Number(raw) : null) : toNumberOrNull(raw);
    const nextBase = { ...base, [field]: nextValue };
    onChange({ base: nextBase });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input
        label="Price per call"
        type="number"
        min={0}
        step="0.0001"
        value={base.price_per_call ?? ""}
        onChange={(event) => handleUpdate("price_per_call", event.target.value)}
        required
      />
      <Input
        label="Included calls (monthly)"
        type="number"
        min={0}
        value={base.included_calls ?? ""}
        onChange={(event) => handleUpdate("included_calls", event.target.value)}
      />
    </div>
  );
}

function renderTieredPricing(value: PriceData, onChange: (nextValue: Record<string, unknown> | null) => void) {
  const tiers = Array.isArray(ensureRecord(value).tiers) ? (ensureRecord(value).tiers as Record<string, unknown>[]) : [];

  const updateTier = (index: number, field: string, raw: string) => {
    const nextTiers = tiers.map((tier, tierIndex) => {
      if (tierIndex !== index) return tier;
      const nextValue = field === "price_per_unit" ? toNumberOrNull(raw) : raw;
      return { ...tier, [field]: nextValue };
    });
    onChange({ tiers: nextTiers });
  };

  const addTier = () => {
    const nextTiers = [...tiers, { name: `Tier ${tiers.length + 1}`, price_per_unit: null, unit: "requests" }];
    onChange({ tiers: nextTiers });
  };

  const removeTier = (index: number) => {
    const nextTiers = tiers.filter((_, tierIndex) => tierIndex !== index);
    onChange(nextTiers.length ? { tiers: nextTiers } : null);
  };

  return (
    <div className="space-y-4">
      {tiers.map((tier, index) => (
        <div
          key={index}
          className="rounded-lg border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60"
        >
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <Input
              label="Tier name"
              value={(tier.name as string) ?? ""}
              onChange={(event) => updateTier(index, "name", event.target.value)}
            />
            <Input
              label="Price per unit"
              type="number"
              min={0}
              step="0.0001"
              value={(tier.price_per_unit as number | null) ?? ""}
              onChange={(event) => updateTier(index, "price_per_unit", event.target.value)}
            />
            <Input
              label="Unit"
              value={(tier.unit as string) ?? "requests"}
              onChange={(event) => updateTier(index, "unit", event.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="danger"
            size="sm"
            className="mt-3"
            onClick={() => removeTier(index)}
          >
            Remove tier
          </Button>
        </div>
      ))}
      <Button type="button" variant="secondary" size="sm" onClick={addTier}>
        Add tier
      </Button>
    </div>
  );
}

export function PriceEditor({ priceModel, value, onChange }: PriceEditorProps) {
  if (!priceModel) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Select a price model to configure pricing data.</p>;
  }

  if (priceModel === "token") {
    return (
      <Fragment>
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Token pricing</h4>
        {renderTokenPricing(value, onChange)}
      </Fragment>
    );
  }

  if (priceModel === "call") {
    return (
      <Fragment>
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Per-call pricing</h4>
        {renderCallPricing(value, onChange)}
      </Fragment>
    );
  }

  if (priceModel === "tiered") {
    return (
      <Fragment>
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Tiered pricing</h4>
        {renderTieredPricing(value, onChange)}
      </Fragment>
    );
  }

  return (
    <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
      <p>Pricing editor for "{priceModel}" is not configured. Please update manually.</p>
      <Button type="button" variant="secondary" size="sm" onClick={() => onChange(null)}>
        Clear pricing data
      </Button>
    </div>
  );
}
