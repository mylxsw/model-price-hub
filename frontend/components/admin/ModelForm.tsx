"use client";

import { useEffect, useState } from "react";

import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { Select } from "../ui/Select";
import { TagInput } from "../ui/TagInput";
import { useAdminVendors } from "../../lib/hooks/useVendors";
import { useModelFilterOptions } from "../../lib/hooks/useModels";
import { PriceEditor } from "./PriceEditor";
import { ImageUploadButton } from "./ImageUploadButton";
import { MODEL_CATEGORIES } from "../../lib/constants";

export interface ModelInput {
  id?: number;
  vendor_id: number;
  model: string;
  vendor_model_id?: string;
  description?: string;
  model_image?: string;
  max_context_tokens?: number | string;
  max_output_tokens?: number | string;
  model_capability: string[];
  model_url?: string;
  price_model?: string;
  price_currency?: string;
  price_data?: Record<string, unknown> | null;
  release_date?: string | null;
  note?: string;
  license: string[];
  categories: string[];
  status?: string;
}

interface ModelFormProps {
  initialValues?: ModelInput;
  onSubmit: (values: ModelInput) => Promise<void>;
  submitLabel?: string;
}

const createDefaultValues = (): ModelInput => ({
  vendor_id: 0,
  model: "",
  vendor_model_id: undefined,
  description: undefined,
  model_image: undefined,
  max_context_tokens: undefined,
  max_output_tokens: undefined,
  model_capability: [],
  model_url: undefined,
  price_model: "token",
  price_currency: "USD",
  price_data: { base: { input_token_1m: null, output_token_1m: null, input_token_cached_1m: null } },
  release_date: undefined,
  note: undefined,
  license: [],
  categories: [],
  status: "enabled"
});

export function ModelForm({ initialValues, onSubmit, submitLabel = "Save model" }: ModelFormProps) {
  const [values, setValues] = useState<ModelInput>(initialValues ?? createDefaultValues());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const filterOptions = useModelFilterOptions();

  useEffect(() => {
    const defaults = createDefaultValues();
    if (initialValues) {
      let priceData: Record<string, unknown> | null = null;

      if (initialValues.price_data) {
        if (typeof initialValues.price_data === "string") {
          try {
            priceData = JSON.parse(initialValues.price_data);
          } catch (error) {
            priceData = null;
          }
        } else {
          priceData = initialValues.price_data as Record<string, unknown>;
        }
      }

      if (!priceData) {
        priceData = defaults.price_data as Record<string, unknown>;
      }

      const normalizeTieredData = (input: unknown): Record<string, unknown> => {
        const ensureRecord = (value: unknown) => (value && typeof value === "object" ? (value as Record<string, unknown>) : {});
        const raw = ensureRecord(input);
        const tiersValue = raw.tiers;
        let tierEntries: Array<Record<string, unknown>> = [];
        if (Array.isArray(tiersValue)) {
          tierEntries = tiersValue.filter((tier): tier is Record<string, unknown> => tier !== null && typeof tier === "object");
        } else if (tiersValue && typeof tiersValue === "object") {
          tierEntries = Object.entries(tiersValue).map(([name, tier]) => {
            if (tier && typeof tier === "object") {
              return { name, ...(tier as Record<string, unknown>) };
            }
            return { name, price_per_unit: tier };
          });
        }

        const normalized = tierEntries.map((tier, index) => {
          const name = typeof tier.name === "string" && tier.name.trim() ? tier.name : `Tier ${index + 1}`;
          const billingRaw = typeof tier.billing === "string" ? tier.billing.toLowerCase() : undefined;
          const unitRaw = typeof tier.unit === "string" ? tier.unit : undefined;
          const inferredBilling = billingRaw === "token" || billingRaw === "requests"
            ? billingRaw
            : unitRaw && unitRaw.toLowerCase().includes("token")
              ? "token"
              : "requests";
          const unit = inferredBilling === "token"
            ? (unitRaw && unitRaw.toLowerCase().includes("1m") ? "1M Tokens" : "1K Tokens")
            : "Requests";

          const parseNumeric = (value: unknown): number | null => {
            if (typeof value === "number" && Number.isFinite(value)) return value;
            if (typeof value === "string" && value.trim()) {
              const parsed = Number(value);
              return Number.isFinite(parsed) ? parsed : null;
            }
            return null;
          };

          const priceValue = tier.price_per_unit ?? tier.price;
          const inputPrice = parseNumeric(tier.input_price_per_unit ?? tier.inputPrice ?? priceValue);
          const cachedPrice = parseNumeric(tier.cached_price_per_unit ?? tier.cachedPrice ?? null);
          const outputPrice = parseNumeric(tier.output_price_per_unit ?? tier.outputPrice ?? priceValue);
          const requestPrice = parseNumeric(priceValue);

          return inferredBilling === "token"
            ? {
                name,
                billing: "token",
                input_price_per_unit: inputPrice,
                cached_price_per_unit: cachedPrice,
                output_price_per_unit: outputPrice,
                unit
              }
            : {
                name,
                billing: "requests",
                price_per_unit: requestPrice,
                unit
              };
        });

        if (normalized.length) {
          return { tiers: normalized };
        }
        return {
          tiers: [
            {
              name: "Tier 1",
              billing: "token",
              input_price_per_unit: null,
              cached_price_per_unit: null,
              output_price_per_unit: null,
              unit: "1K Tokens"
            }
          ]
        };
      };

      if (initialValues.price_model === "token") {
        const base =
          priceData && typeof priceData === "object" && "base" in priceData
            ? (priceData as Record<string, unknown>).base
            : undefined;
        const baseRecord =
          base && typeof base === "object" ? (base as Record<string, unknown>) : {};
        priceData = {
          ...(priceData && typeof priceData === "object"
            ? (priceData as Record<string, unknown>)
            : {}),
          base: {
            input_token_1m: baseRecord.input_token_1m ?? null,
            output_token_1m: baseRecord.output_token_1m ?? null,
            input_token_cached_1m: baseRecord.input_token_cached_1m ?? null
          }
        };
      }

      if (initialValues.price_model === "tiered") {
        priceData = normalizeTieredData(priceData);
      }
      const expandStringList = (input: unknown): string[] => {
        if (!input) return [];
        if (Array.isArray(input)) {
          return input.flatMap((item) => expandStringList(item));
        }
        if (typeof input === "string") {
          const trimmed = input.trim();
          if (!trimmed) return [];
          try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed) || typeof parsed === "string") {
              return expandStringList(parsed);
            }
          } catch (error) {
            // ignore parse errors and fall through to using the raw string
          }
          return [trimmed];
        }
        return [];
      };

      const normalizeStringArray = (value: unknown): string[] => {
        const result: string[] = [];
        for (const entry of expandStringList(value)) {
          const normalized = entry.trim();
          if (normalized && !result.includes(normalized)) {
            result.push(normalized);
          }
        }
        return result;
      };
      setValues({
        ...defaults,
        ...initialValues,
        model_capability: normalizeStringArray(initialValues.model_capability),
        license: normalizeStringArray(initialValues.license),
        categories: normalizeStringArray((initialValues as Record<string, unknown>).categories),
        price_data: priceData ?? (defaults.price_data as Record<string, unknown>),
        release_date: initialValues.release_date ? initialValues.release_date.slice(0, 10) : undefined
      });
    } else {
      setValues(defaults);
    }
  }, [initialValues]);

  const handleChange = <Field extends keyof ModelInput>(field: Field, value: ModelInput[Field]) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const parseOptionalNumber = (value: ModelInput["max_context_tokens"]): number | undefined => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return undefined;
      const parsed = Number(trimmed);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return Number.isFinite(value) ? value : undefined;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        ...values,
        max_context_tokens: parseOptionalNumber(values.max_context_tokens),
        max_output_tokens: parseOptionalNumber(values.max_output_tokens),
        release_date: values.release_date ? values.release_date : undefined
      });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Failed to save model");
    } finally {
      setLoading(false);
    }
  };

  const vendorsQuery = useAdminVendors();
  const vendorOptions = (vendorsQuery.data?.items ?? []).map((vendor) => ({ value: String(vendor.id), label: vendor.name }));

  const handlePriceModelChange = (nextModel: string) => {
    let nextPriceData = values.price_data ?? null;
    if (!values.price_data || values.price_model !== nextModel) {
      switch (nextModel) {
        case "token":
          nextPriceData = { base: { input_token_1m: null, output_token_1m: null, input_token_cached_1m: null } };
          break;
        case "call":
          nextPriceData = { base: { price_per_call: null } };
          break;
        case "tiered":
          nextPriceData = {
            tiers: [
              {
                name: "Tier 1",
                billing: "token",
                input_price_per_unit: null,
                cached_price_per_unit: null,
                output_price_per_unit: null,
                unit: "1K Tokens"
              }
            ]
          };
          break;
        default:
          nextPriceData = null;
      }
    }
    setValues((current) => ({ ...current, price_model: nextModel, price_data: nextPriceData }));
  };

  return (
    <Card title={initialValues ? "Edit model" : "Create model"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Vendor"
          value={values.vendor_id ? String(values.vendor_id) : ""}
          onChange={(event) => handleChange("vendor_id", Number(event.target.value))}
          options={[{ label: vendorOptions.length ? "Select a vendor" : "Loading vendors...", value: "" }, ...vendorOptions]}
          required
          disabled={vendorsQuery.isLoading && !vendorOptions.length}
        />
        <Input label="Model name" value={values.model} onChange={(event) => handleChange("model", event.target.value)} required />
        <Input
          label="Vendor model ID"
          value={values.vendor_model_id ?? ""}
          onChange={(event) => handleChange("vendor_model_id", event.target.value)}
        />
        <Textarea
          label="Description"
          value={values.description ?? ""}
          onChange={(event) => handleChange("description", event.target.value)}
          placeholder="Supports Markdown formatting"
          rows={6}
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="sm:flex-1">
            <Input
              label="Model image URL"
              value={values.model_image ?? ""}
              onChange={(event) => handleChange("model_image", event.target.value)}
            />
          </div>
          <ImageUploadButton
            label="Upload"
            className="w-full sm:w-auto"
            onUploaded={(url) => {
              setValues((current) => ({ ...current, model_image: url }));
              setError(null);
            }}
            onError={(message) => setError(message)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Max context tokens"
            type="number"
            value={values.max_context_tokens ?? ""}
            onChange={(event) => handleChange("max_context_tokens", event.target.value)}
          />
          <Input
            label="Max output tokens"
            type="number"
            value={values.max_output_tokens ?? ""}
            onChange={(event) => handleChange("max_output_tokens", event.target.value)}
          />
        </div>
        <TagInput
          label="Capabilities"
          values={values.model_capability}
          onChange={(list) => handleChange("model_capability", list)}
          placeholder="Add capability"
          suggestions={filterOptions.data?.capabilities ?? []}
          suggestionLabel="Existing capabilities"
        />
        <div className="space-y-2">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-200">Categories</span>
          <div className="flex flex-wrap gap-2">
            {MODEL_CATEGORIES.map((category) => {
              const isActive = values.categories.includes(category.value);
              return (
                <Button
                  key={category.value}
                  type="button"
                  variant={isActive ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => toggleCategory(category.value)}
                >
                  {category.label}
                </Button>
              );
            })}
          </div>
        </div>
        <Input
          label="Model URL"
          value={values.model_url ?? ""}
          onChange={(event) => handleChange("model_url", event.target.value)}
        />
        <Input
          label="Release date"
          type="date"
          value={values.release_date ?? ""}
          onChange={(event) => handleChange("release_date", event.target.value || undefined)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Price model"
            value={values.price_model ?? ""}
            onChange={(event) => handlePriceModelChange(event.target.value)}
            options={[
              { label: "Token based", value: "token" },
              { label: "Per call", value: "call" },
              { label: "Tiered", value: "tiered" },
              { label: "Free", value: "free" },
              { label: "Unknown", value: "unknown" }
            ]}
            required
          />
          <Select
            label="Currency"
            value={values.price_currency ?? "USD"}
            onChange={(event) => handleChange("price_currency", event.target.value)}
            options={[
              { label: "USD", value: "USD" },
              { label: "CNY", value: "CNY" },
            ]}
            required
          />
        </div>
        <PriceEditor priceModel={values.price_model} value={values.price_data} onChange={(next) => handleChange("price_data", next ?? null)} />
        <TagInput
          label="Licenses"
          values={values.license}
          onChange={(list) => handleChange("license", list)}
          placeholder="Add license"
          suggestions={filterOptions.data?.licenses ?? []}
          suggestionLabel="Existing licenses"
        />
        <Select
          label="Status"
          value={values.status ?? "enabled"}
          onChange={(event) => handleChange("status", event.target.value)}
          options={[
            { label: "Enabled", value: "enabled" },
            { label: "Disabled", value: "disabled" },
            { label: "Outdated", value: "outdated" }
          ]}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Saving..." : submitLabel}
        </Button>
      </form>
    </Card>
  );
}
  const toggleCategory = (category: string) => {
    setValues((current) => {
      const exists = current.categories.includes(category);
      const nextCategories = exists
        ? current.categories.filter((item) => item !== category)
        : [...current.categories, category];
      return { ...current, categories: nextCategories };
    });
  };

