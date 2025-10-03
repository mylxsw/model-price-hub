"use client";

import { useEffect, useState } from "react";

import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Select } from "../ui/Select";
import { ImageUploadButton } from "./ImageUploadButton";

export interface VendorInput {
  id?: number;
  name: string;
  description?: string;
  vendor_image?: string;
  url?: string;
  api_url?: string;
  note?: string;
  status?: string;
}

interface VendorFormProps {
  initialValues?: VendorInput;
  onSubmit: (values: VendorInput) => Promise<void>;
  submitLabel?: string;
}

const createDefaultVendorValues = (): VendorInput => ({
  name: "",
  description: "",
  vendor_image: "",
  url: "",
  api_url: "",
  note: "",
  status: "enabled"
});

export function VendorForm({ initialValues, onSubmit, submitLabel = "Save vendor" }: VendorFormProps) {
  const [values, setValues] = useState<VendorInput>(initialValues ?? createDefaultVendorValues());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialValues) {
      setValues({ ...createDefaultVendorValues(), ...initialValues });
    } else {
      setValues(createDefaultVendorValues());
    }
  }, [initialValues]);

  const handleChange = (field: keyof VendorInput, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSubmit(values);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Failed to save vendor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title={initialValues ? "Edit vendor" : "Create vendor"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Name" value={values.name} onChange={(event) => handleChange("name", event.target.value)} required />
        <Input
          label="Description"
          value={values.description ?? ""}
          onChange={(event) => handleChange("description", event.target.value)}
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="sm:flex-1">
            <Input
              label="Vendor image URL"
              value={values.vendor_image ?? ""}
              onChange={(event) => handleChange("vendor_image", event.target.value)}
            />
          </div>
          <ImageUploadButton
            label="Upload"
            className="w-full sm:w-auto"
            onUploaded={(url) => {
              setValues((current) => ({ ...current, vendor_image: url }));
              setError(null);
            }}
            onError={(message) => setError(message)}
          />
        </div>
        <Input label="Website" value={values.url ?? ""} onChange={(event) => handleChange("url", event.target.value)} />
        <Input
          label="API URL"
          value={values.api_url ?? ""}
          onChange={(event) => handleChange("api_url", event.target.value)}
        />
        <Input label="Note" value={values.note ?? ""} onChange={(event) => handleChange("note", event.target.value)} />
        <Select
          label="Status"
          value={values.status ?? "enabled"}
          onChange={(event) => handleChange("status", event.target.value)}
          options={[
            { label: "Enabled", value: "enabled" },
            { label: "Disabled", value: "disabled" }
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
