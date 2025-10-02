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
    const priceModel = (data as any).price_model ?? (data as any).priceModel;
    const priceCurrency = (data as any).price_currency ?? (data as any).priceCurrency;
    const priceData = (data as any).price_data ?? (data as any).priceData;
    const releaseDate = (data as any).release_date ?? (data as any).releaseDate ?? null;
    const modelUrl = (data as any).model_url ?? (data as any).modelUrl;
    const capabilities = (data as any).model_capability ?? (data as any).modelCapability ?? [];
    const license = (data as any).license ?? (data as any).licenses ?? [];
    const maxContextTokens =
      (data as any).max_context_tokens ?? (data as any).maxContextTokens ?? undefined;
    const maxOutputTokens =
      (data as any).max_output_tokens ?? (data as any).maxOutputTokens ?? undefined;
    return {
      id: data.id,
      vendor_id: (data as any).vendor_id ?? (data as any).vendorId,
      model: data.model,
      vendor_model_id: data.vendor_model_id,
      description: data.description,
      model_image: data.model_image,
      max_context_tokens: maxContextTokens,
      max_output_tokens: maxOutputTokens,
      model_capability: capabilities,
      model_url: modelUrl,
      price_model: priceModel,
      price_currency: priceCurrency,
      price_data: priceData ?? null,
      release_date: releaseDate,
      note: data.note,
      license,
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Edit model</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Update model metadata, pricing, and availability.</p>
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
