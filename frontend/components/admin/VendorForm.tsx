"use client";

import { useState } from "react";

import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

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

export function VendorForm({ initialValues, onSubmit, submitLabel = "Save vendor" }: VendorFormProps) {
  const [values, setValues] = useState<VendorInput>(
    initialValues ?? {
      name: "",
      description: "",
      vendor_image: "",
      url: "",
      api_url: "",
      note: "",
      status: "enabled"
    }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        <Input
          label="Vendor image URL"
          value={values.vendor_image ?? ""}
          onChange={(event) => handleChange("vendor_image", event.target.value)}
        />
        <Input label="Website" value={values.url ?? ""} onChange={(event) => handleChange("url", event.target.value)} />
        <Input
          label="API URL"
          value={values.api_url ?? ""}
          onChange={(event) => handleChange("api_url", event.target.value)}
        />
        <Input label="Note" value={values.note ?? ""} onChange={(event) => handleChange("note", event.target.value)} />
        <Input label="Status" value={values.status ?? ""} onChange={(event) => handleChange("status", event.target.value)} />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Saving..." : submitLabel}
        </Button>
      </form>
    </Card>
  );
}
