"use client";

import { useMemo, useState } from "react";

import { ModelForm, ModelInput } from "../../../../components/admin/ModelForm";
import { Card } from "../../../../components/ui/Card";
import { Table } from "../../../../components/ui/Table";
import { Button } from "../../../../components/ui/Button";
import { Badge } from "../../../../components/ui/Badge";
import { ApiClient } from "../../../../lib/apiClient";
import { useAdminModels } from "../../../../lib/hooks/useModels";
import { useAuthStore } from "../../../../lib/hooks/useAuth";

const client = new ApiClient({
  getToken: () => useAuthStore.getState().token ?? null
});

export default function AdminModelsPage() {
  const { data, refetch, isFetching } = useAdminModels();
  const [editingModel, setEditingModel] = useState<ModelInput | null>(null);

  const handleSubmit = async (values: ModelInput) => {
    let parsedPriceData: unknown = undefined;
    if (values.price_data) {
      try {
        parsedPriceData = JSON.parse(values.price_data);
      } catch (error) {
        throw new Error("Price data must be valid JSON");
      }
    }

    const payload = {
      ...values,
      price_data: parsedPriceData
    };
    if (values.id) {
      await client.put(`/api/admin/models/${values.id}`, payload);
    } else {
      await client.post("/api/admin/models", payload);
    }
    setEditingModel(null);
    await refetch();
  };

  const models = useMemo(() => data?.items ?? [], [data?.items]);

  const handleEdit = (model: any) => {
    setEditingModel({
      id: model.id,
      vendor_id: model.vendor_id,
      model: model.model,
      vendor_model_id: model.vendor_model_id,
      description: model.description,
      model_image: model.model_image,
      max_context_tokens: model.max_context_tokens,
      max_output_tokens: model.max_output_tokens,
      model_capability: model.model_capability ?? [],
      model_url: model.model_url,
      price_model: model.price_model,
      price_currency: model.price_currency,
      price_data: model.price_data ? JSON.stringify(model.price_data, null, 2) : "",
      note: model.note,
      license: model.license ?? [],
      status: model.status
    });
  };

  const handleDelete = async (modelId: number) => {
    await client.delete(`/api/admin/models/${modelId}`);
    await refetch();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <Card
        title="Models"
        description="All catalog entries across vendors."
        actions={<span className="text-xs text-slate-500">{isFetching ? "Refreshing..." : `${data?.total ?? 0} models`}</span>}
      >
        <Table
          data={models}
          columns={[
            {
              header: "Model",
              accessor: (model) => (
                <div>
                  <p className="font-medium text-slate-100">{model.model}</p>
                  <p className="text-xs text-slate-400">{model.vendor?.name}</p>
                </div>
              )
            },
            {
              header: "Pricing",
              accessor: (model) => (
                <span className="text-xs uppercase text-slate-400">
                  {model.price_model ?? "n/a"} • {model.price_currency ?? ""}
                </span>
              )
            },
            {
              header: "Capabilities",
              accessor: (model) => (
                <div className="flex flex-wrap gap-1">
                  {(model.model_capability ?? []).slice(0, 3).map((capability: string) => (
                    <Badge key={capability} color="secondary">
                      {capability}
                    </Badge>
                  ))}
                </div>
              )
            },
            {
              header: "Actions",
              accessor: (model) => (
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(model)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(model.id)}>
                    Delete
                  </Button>
                </div>
              )
            }
          ]}
        />
      </Card>
      <ModelForm
        initialValues={editingModel ?? undefined}
        onSubmit={handleSubmit}
        submitLabel={editingModel ? "Update model" : "Create model"}
      />
    </div>
  );
}
