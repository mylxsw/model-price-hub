"use client";

import { Fragment } from "react";

import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Select } from "../ui/Select";

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

const readNumericField = (record: Record<string, unknown>, key: string): number | null => {
  const raw = record[key];
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw;
  }
  if (typeof raw === "string") {
    return toNumberOrNull(raw);
  }
  return null;
};

function renderTokenPricing(value: PriceData, onChange: (nextValue: Record<string, unknown> | null) => void) {
  const baseSource = ensureRecord(ensureRecord(value).base);
  const base = {
    input_token_1m: readNumericField(baseSource, "input_token_1m"),
    output_token_1m: readNumericField(baseSource, "output_token_1m"),
    input_token_cached_1m: readNumericField(baseSource, "input_token_cached_1m")
  };

  const handleUpdate = (field: keyof typeof base, raw: string) => {
    const nextBase = { ...baseSource, [field]: toNumberOrNull(raw) };
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
  const baseSource = ensureRecord(ensureRecord(value).base);
  const base = {
    price_per_call: readNumericField(baseSource, "price_per_call"),
    included_calls: readNumericField(baseSource, "included_calls")
  };
  const handleUpdate = (field: keyof typeof base, raw: string) => {
    const nextValue = field === "included_calls" ? (raw.trim() ? Number(raw) || null : null) : toNumberOrNull(raw);
    const nextBase = { ...baseSource, [field]: nextValue };
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

const billingOptions = [
  { label: "Tokens", value: "token" },
  { label: "Requests", value: "requests" }
];

const tokenUnitOptions = [
  { label: "1K Tokens", value: "1K Tokens" },
  { label: "1M Tokens", value: "1M Tokens" }
];

const requestUnitOptions = [{ label: "Requests", value: "Requests" }];

function normalizeTierList(value: PriceData): Record<string, unknown>[] {
  const record = ensureRecord(value);
  const tiers = record.tiers;
  if (Array.isArray(tiers)) {
    return tiers.filter((tier): tier is Record<string, unknown> => typeof tier === "object" && tier !== null);
  }
  if (tiers && typeof tiers === "object") {
    return Object.entries(tiers).map(([name, tier]) => {
      if (tier && typeof tier === "object") {
        return { name, ...(tier as Record<string, unknown>) };
      }
      return { name, price_per_unit: tier };
    });
  }
  return [];
}

function renderTieredPricing(value: PriceData, onChange: (nextValue: Record<string, unknown> | null) => void) {
  const tiers = normalizeTierList(value);

  const updateTiers = (next: Record<string, unknown>[]) => {
    onChange(next.length ? { tiers: next } : null);
  };

  const updateTier = (index: number, updater: (tier: Record<string, unknown>) => Record<string, unknown>) => {
    const nextTiers = tiers.map((tier, tierIndex) => (tierIndex === index ? updater(tier) : tier));
    updateTiers(nextTiers);
  };

  const asNumber = (value: unknown): number | null => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };

  const addTier = () => {
    const nextTier = {
      name: `Tier ${tiers.length + 1}`,
      billing: "token",
      input_price_per_unit: null,
      cached_price_per_unit: null,
      output_price_per_unit: null,
      unit: "1K Tokens"
    };
    updateTiers([...tiers, nextTier]);
  };

  const removeTier = (index: number) => {
    updateTiers(tiers.filter((_, tierIndex) => tierIndex !== index));
  };

  return (
    <div className="space-y-4">
      {tiers.map((tier, index) => {
        const billingRaw = typeof tier.billing === "string" ? tier.billing : "token";
        const billing = billingRaw === "requests" ? "requests" : "token";
        const unitOptions = billing === "token" ? tokenUnitOptions : requestUnitOptions;
        const unitRaw = typeof tier.unit === "string" ? tier.unit : unitOptions[0]?.value;
        const tokenPrices = {
          input: asNumber(tier.input_price_per_unit),
          cached: asNumber(tier.cached_price_per_unit),
          output: asNumber(tier.output_price_per_unit)
        };
        const requestPrice = asNumber(tier.price_per_unit);
        const isFree = Boolean(
          (tier.is_free as boolean | undefined) ?? (tier.isFree as boolean | undefined)
        );
        return (
          <div
            key={index}
            className="rounded-lg border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60"
          >
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <Input
                  label="Tier name"
                  value={(tier.name as string) ?? ""}
                  onChange={(event) => updateTier(index, (current) => ({ ...current, name: event.target.value }))}
                />
                <Select
                  label="Billing"
                  value={billing}
                  onChange={(event) => {
                    const nextBilling = event.target.value === "requests" ? "requests" : "token";
                    updateTier(index, (current) => ({
                      ...current,
                      billing: nextBilling,
                      unit: nextBilling === "token" ? "1K Tokens" : "Requests",
                      price_per_unit:
                        nextBilling === "requests"
                          ? current.price_per_unit ?? current.input_price_per_unit ?? current.output_price_per_unit ?? current.cached_price_per_unit ?? null
                          : null,
                      input_price_per_unit:
                        nextBilling === "token"
                          ? current.input_price_per_unit ?? current.price_per_unit ?? null
                          : null,
                      cached_price_per_unit:
                        nextBilling === "token" ? current.cached_price_per_unit ?? null : null,
                      output_price_per_unit:
                        nextBilling === "token"
                          ? current.output_price_per_unit ?? current.price_per_unit ?? null
                          : null
                    }));
                  }}
                  options={billingOptions}
                />
                <Select
                  label="Unit"
                  value={unitOptions.some((option) => option.value === unitRaw) ? unitRaw : unitOptions[0]?.value}
                  onChange={(event) =>
                    updateTier(index, (current) => ({
                      ...current,
                      unit: event.target.value
                    }))
                  }
                  options={unitOptions}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={isFree}
                  onChange={(event) =>
                    updateTier(index, (current) => ({
                      ...current,
                      is_free: event.target.checked,
                      price_per_unit: null,
                      input_price_per_unit: null,
                      cached_price_per_unit: null,
                      output_price_per_unit: null
                    }))
                  }
                />
                Free tier
              </label>

              {billing === "token" ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Input
                    label="Input tokens price"
                    type="number"
                    min={0}
                    step="0.0001"
                    value={tokenPrices.input ?? ""}
                    disabled={isFree}
                    onChange={(event) =>
                      updateTier(index, (current) => ({
                        ...current,
                        input_price_per_unit: toNumberOrNull(event.target.value)
                      }))
                    }
                  />
                  <Input
                    label="Cached tokens price"
                    type="number"
                    min={0}
                    step="0.0001"
                    value={tokenPrices.cached ?? ""}
                    disabled={isFree}
                    onChange={(event) =>
                      updateTier(index, (current) => ({
                        ...current,
                        cached_price_per_unit: toNumberOrNull(event.target.value)
                      }))
                    }
                  />
                  <Input
                    label="Output tokens price"
                    type="number"
                    min={0}
                    step="0.0001"
                    value={tokenPrices.output ?? ""}
                    disabled={isFree}
                    onChange={(event) =>
                      updateTier(index, (current) => ({
                        ...current,
                        output_price_per_unit: toNumberOrNull(event.target.value)
                      }))
                    }
                  />
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Input
                    label="Price per unit"
                    type="number"
                    min={0}
                    step="0.0001"
                    value={requestPrice ?? ""}
                    disabled={isFree}
                    onChange={(event) =>
                      updateTier(index, (current) => ({
                        ...current,
                        price_per_unit: toNumberOrNull(event.target.value)
                      }))
                    }
                  />
                </div>
              )}
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
        );
      })}
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

  if (priceModel === "free") {
    return (
      <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-500/60 dark:bg-emerald-500/10 dark:text-emerald-200">
        This model is marked as free. No pricing data is required.
      </p>
    );
  }

  if (priceModel === "unknown") {
    return (
      <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
        <p>Pricing details are currently unknown. You can add notes in the model description to provide additional context.</p>
        <Button type="button" variant="secondary" size="sm" onClick={() => onChange(null)}>
          Clear pricing data
        </Button>
      </div>
    );
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
