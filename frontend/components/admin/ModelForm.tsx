"use client";

import { useEffect, useState } from "react";

import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { TagInput } from "../ui/TagInput";
import { useAdminVendors } from "../../lib/hooks/useVendors";
import { PriceEditor } from "./PriceEditor";

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
  status: "enabled"
});

export function ModelForm({ initialValues, onSubmit, submitLabel = "Save model" }: ModelFormProps) {
  const [values, setValues] = useState<ModelInput>(initialValues ?? createDefaultValues());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      const normalizeStringArray = (value: unknown): string[] => {
        if (!value) return [];
        if (Array.isArray(value)) {
          return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
        }
        if (typeof value === "string") {
          try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
              return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
            }
          } catch (error) {
            // fall through
          }
          return value.trim() ? [value.trim()] : [];
        }
        return [];
      };
      setValues({
        ...defaults,
        ...initialValues,
        model_capability: normalizeStringArray(initialValues.model_capability),
        license: normalizeStringArray(initialValues.license),
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        ...values,
        max_context_tokens: values.max_context_tokens ? Number(values.max_context_tokens) : undefined,
        max_output_tokens: values.max_output_tokens ? Number(values.max_output_tokens) : undefined,
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
          nextPriceData = { tiers: [{ name: "Tier 1", price_per_unit: null, unit: "requests" }] };
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
        <Input
          label="Description"
          value={values.description ?? ""}
          onChange={(event) => handleChange("description", event.target.value)}
        />
        <Input
          label="Model image URL"
          value={values.model_image ?? ""}
          onChange={(event) => handleChange("model_image", event.target.value)}
        />
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
        <TagInput label="Capabilities" values={values.model_capability} onChange={(list) => handleChange("model_capability", list)} />
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
              { label: "Tiered", value: "tiered" }
            ]}
            required
          />
          <Select
            label="Currency"
            value={values.price_currency ?? "USD"}
            onChange={(event) => handleChange("price_currency", event.target.value)}
            options={[
              { label: "USD", value: "USD" },
              { label: "EUR", value: "EUR" },
              { label: "CNY", value: "CNY" },
              { label: "JPY", value: "JPY" }
            ]}
            required
          />
        </div>
        <PriceEditor priceModel={values.price_model} value={values.price_data} onChange={(next) => handleChange("price_data", next ?? null)} />
        <TagInput label="Licenses" values={values.license} onChange={(list) => handleChange("license", list)} />
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
