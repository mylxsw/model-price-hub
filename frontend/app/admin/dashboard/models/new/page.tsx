"use client";

import { useRouter } from "next/navigation";

import { ModelForm, ModelInput } from "../../../../../components/admin/ModelForm";
import { Button } from "../../../../../components/ui/Button";
import { useToast } from "../../../../../components/ui/ToastProvider";
import { ApiClient } from "../../../../../lib/apiClient";
import { useAuthStore } from "../../../../../lib/hooks/useAuth";

const client = new ApiClient({
  getToken: () => useAuthStore.getState().token ?? null
});

export default function CreateModelPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const handleSubmit = async (values: ModelInput) => {
    const payload = {
      ...values,
      price_data: values.price_data ?? undefined
    };
    try {
      await client.post("/api/admin/models", payload);
      showToast({
        variant: "success",
        title: "Model created",
        description: values.model ? `${values.model} has been added.` : "The model has been added."
      });
      router.push("/admin/dashboard/models");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create model";
      showToast({ variant: "error", title: "Model creation failed", description: message });
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Create model</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Publish a new model entry with pricing and capabilities.</p>
        </div>
        <Button variant="secondary" onClick={() => router.push("/admin/dashboard/models")}>Back to models</Button>
      </div>
      <ModelForm onSubmit={handleSubmit} submitLabel="Create model" />
    </div>
  );
}
