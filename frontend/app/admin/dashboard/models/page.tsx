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
                  {model.price_model ?? "n/a"} • {model.price_currency ?? ""}
                </span>
              )
            },
            {
              header: "Release",
              accessor: (model) => (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {model.release_date
                    ? new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric" }).format(
                        new Date(model.release_date)
                      )
                    : "—"}
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
