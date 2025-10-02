"use client";

import { useState } from "react";

import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { TagInput } from "../ui/TagInput";

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
  price_data?: string;
  note?: string;
  license: string[];
  status?: string;
}

interface ModelFormProps {
  initialValues?: ModelInput;
  onSubmit: (values: ModelInput) => Promise<void>;
  submitLabel?: string;
}

export function ModelForm({ initialValues, onSubmit, submitLabel = "Save model" }: ModelFormProps) {
  const [values, setValues] = useState<ModelInput>(
    initialValues ?? {
      vendor_id: 0,
      model: "",
      model_capability: [],
      license: [],
      price_model: "token",
      price_currency: "USD"
    }
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof ModelInput, value: string | number | string[]) => {
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
        max_output_tokens: values.max_output_tokens ? Number(values.max_output_tokens) : undefined
      });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Failed to save model");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title={initialValues ? "Edit model" : "Create model"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Vendor ID"
          type="number"
          value={values.vendor_id}
          onChange={(event) => handleChange("vendor_id", Number(event.target.value))}
          required
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Price model"
            value={values.price_model ?? ""}
            onChange={(event) => handleChange("price_model", event.target.value)}
          />
          <Input
            label="Price currency"
            value={values.price_currency ?? ""}
            onChange={(event) => handleChange("price_currency", event.target.value)}
          />
        </div>
        <label className="flex flex-col gap-2 text-sm text-slate-300">
          <span className="font-medium text-slate-200">Price data (JSON)</span>
          <textarea
            className="min-h-[120px] rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm"
            value={values.price_data ?? ""}
            onChange={(event) => handleChange("price_data", event.target.value)}
            placeholder='{"base":{"input_token_1m":0.5}}'
          />
        </label>
        <TagInput label="Licenses" values={values.license} onChange={(list) => handleChange("license", list)} />
        <Input label="Status" value={values.status ?? "enabled"} onChange={(event) => handleChange("status", event.target.value)} />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Saving..." : submitLabel}
        </Button>
      </form>
    </Card>
  );
}
