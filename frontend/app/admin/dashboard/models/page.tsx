"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

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

const readField = <T = unknown>(model: any, snake: string, camel?: string): T | undefined => {
  if (model && Object.prototype.hasOwnProperty.call(model, snake)) {
    return model[snake] as T;
  }
  if (camel && model && Object.prototype.hasOwnProperty.call(model, camel)) {
    return model[camel] as T;
  }
  return undefined;
};

const toStringArray = (value: unknown): string[] => {
  const expand = (input: unknown): string[] => {
    if (!input) return [];
    if (Array.isArray(input)) {
      return input.flatMap((item) => expand(item));
    }
    if (typeof input === "string") {
      const trimmed = input.trim();
      if (!trimmed) return [];
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed) || typeof parsed === "string") {
          return expand(parsed);
        }
      } catch (error) {
        // ignore parse errors and fall back to using the raw string
      }
      return [trimmed];
    }
    return [];
  };

  const deduped: string[] = [];
  for (const entry of expand(value)) {
    const normalized = entry.trim();
    if (normalized && !deduped.includes(normalized)) {
      deduped.push(normalized);
    }
  }
  return deduped;
};

export default function AdminModelsPage() {
  const { data, refetch, isFetching } = useAdminModels();
  const router = useRouter();

  const models = useMemo(() => data?.items ?? [], [data?.items]);

  const handleDelete = async (modelId: number) => {
    await client.delete(`/api/admin/models/${modelId}`);
    await refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Models</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage catalog entries and their pricing structures.</p>
        </div>
        <Button onClick={() => router.push("/admin/dashboard/models/new")}>Add model</Button>
      </div>
      <Card
        title="Models"
        description="All catalog entries across vendors."
        actions={
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {isFetching ? "Refreshing..." : `${data?.total ?? 0} models`}
          </span>
        }
      >
        <Table
          data={models}
          columns={[
            {
              header: "Model",
              accessor: (model) => (
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-100">{model.model}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{model.vendor?.name}</p>
                </div>
              )
            },
            {
              header: "Pricing",
              accessor: (model) => (
                <span className="text-xs uppercase text-slate-500 dark:text-slate-400">
                  {readField<string>(model, "price_model", "priceModel") ?? "n/a"} •
                  {" "}
                  {readField<string>(model, "price_currency", "priceCurrency") ?? ""}
                </span>
              )
            },
            {
              header: "Release",
              accessor: (model) => (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {(() => {
                    const value = readField<string>(model, "release_date", "releaseDate");
                    if (!value) return "—";
                    const date = new Date(value);
                    if (Number.isNaN(date.getTime())) return "—";
                    return new Intl.DateTimeFormat("en", {
                      year: "numeric",
                      month: "short",
                      day: "numeric"
                    }).format(date);
                  })()}
                </span>
              )
            },
            {
              header: "Capabilities",
              accessor: (model) => (
                <div className="flex flex-wrap gap-1">
                  {toStringArray(readField(model, "model_capability", "modelCapability"))
                    .slice(0, 3)
                    .map((capability: string) => (
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
                  <Button variant="success" size="sm" onClick={() => router.push(`/admin/dashboard/models/${model.id}`)}>
                    Edit
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(model.id)}>
                    Delete
                  </Button>
                </div>
              )
            }
          ]}
        />
      </Card>
    </div>
  );
}
