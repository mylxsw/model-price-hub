"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";

import { ModelForm, ModelInput } from "../../../../../components/admin/ModelForm";
import { Button } from "../../../../../components/ui/Button";
import { ApiClient } from "../../../../../lib/apiClient";
import { useAuthStore } from "../../../../../lib/hooks/useAuth";
import { useAdminModel } from "../../../../../lib/hooks/useModels";

const client = new ApiClient({
  getToken: () => useAuthStore.getState().token ?? null
});

export default function EditModelPage() {
  const params = useParams<{ modelId: string }>();
  const router = useRouter();
  const modelId = Number(params.modelId);
  const { data, isLoading, error } = useAdminModel(Number.isFinite(modelId) ? modelId : undefined);

  const initialValues = useMemo<ModelInput | undefined>(() => {
    if (!data) return undefined;
    return {
      id: data.id,
      vendor_id: data.vendor_id,
      model: data.model,
      vendor_model_id: data.vendor_model_id,
      description: data.description,
      model_image: data.model_image,
      max_context_tokens: data.max_context_tokens ?? undefined,
      max_output_tokens: data.max_output_tokens ?? undefined,
      model_capability: data.model_capability ?? [],
      model_url: data.model_url,
      price_model: data.price_model,
      price_currency: data.price_currency,
      price_data: data.price_data ?? null,
      release_date: data.release_date ?? null,
      note: data.note,
      license: data.license ?? [],
      status: data.status
    };
  }, [data]);

  const handleSubmit = async (values: ModelInput) => {
    const payload = {
      ...values,
      price_data: values.price_data ?? undefined
    };
    await client.put(`/api/admin/models/${modelId}`, payload);
    router.push("/admin/dashboard/models");
    router.refresh();
  };

  return (
    <div className="space-y-6 px-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Edit model</h1>
          <p className="text-sm text-slate-400">Update model metadata, pricing, and availability.</p>
        </div>
        <Button variant="secondary" onClick={() => router.push("/admin/dashboard/models")}>Back to models</Button>
      </div>
      {isLoading && <p className="text-sm text-slate-400">Loading model...</p>}
      {error && <p className="text-sm text-red-400">Failed to load model details.</p>}
      {!isLoading && !error && initialValues && (
        <ModelForm initialValues={initialValues} onSubmit={handleSubmit} submitLabel="Save changes" />
      )}
      {!isLoading && !error && !initialValues && (
        <p className="text-sm text-slate-400">Model not found.</p>
      )}
    </div>
  );
}
