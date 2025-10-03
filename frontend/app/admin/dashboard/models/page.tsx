"use client";

import { ChangeEvent, useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Card } from "../../../../components/ui/Card";
import { Table } from "../../../../components/ui/Table";
import { Button } from "../../../../components/ui/Button";
import { Badge } from "../../../../components/ui/Badge";
import { Input } from "../../../../components/ui/Input";
import { Select } from "../../../../components/ui/Select";
import { PriceDisplay } from "../../../../components/catalog/PriceDisplay";
import { ModelFilterValues } from "../../../../components/catalog/ModelFilterPanel";
import { ApiClient } from "../../../../lib/apiClient";
import { useAdminModels, useModelFilterOptions } from "../../../../lib/hooks/useModels";
import { useAuthStore } from "../../../../lib/hooks/useAuth";

const client = new ApiClient({
  getToken: () => useAuthStore.getState().token ?? null
});

const defaultFilters: ModelFilterValues = {
  search: "",
  vendorName: "",
  priceModel: "",
  priceCurrency: "",
  capability: "",
  license: ""
};

const priceModelOptions = [
  { label: "All pricing", value: "" },
  { label: "Token based", value: "token" },
  { label: "Per call", value: "call" },
  { label: "Tiered", value: "tiered" }
];

const currencyOptions = [
  { label: "All currencies", value: "" },
  { label: "USD", value: "USD" },
  { label: "EUR", value: "EUR" },
  { label: "CNY", value: "CNY" },
  { label: "JPY", value: "JPY" }
];

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

interface ImportResult {
  created: number;
  updated: number;
  errors: string[];
}

export default function AdminModelsPage() {
  const [filters, setFilters] = useState<ModelFilterValues>(defaultFilters);
  const adminFilters = useMemo(
    () => ({
      search: filters.search || undefined,
      vendor_name: filters.vendorName || undefined,
      price_model: filters.priceModel || undefined,
      price_currency: filters.priceCurrency || undefined,
      capabilities: filters.capability || undefined,
      license: filters.license || undefined
    }),
    [filters]
  );
  const { data, refetch, isFetching } = useAdminModels(adminFilters);
  const { data: filterOptions, isLoading: filtersLoading } = useModelFilterOptions();
  const router = useRouter();

  const models = useMemo(() => data?.items ?? [], [data?.items]);

  const vendorOptions = useMemo(
    () => [
      { label: "All vendors", value: "" },
      ...((filterOptions?.vendors ?? []).map((vendor) => ({ label: vendor, value: vendor })))
    ],
    [filterOptions?.vendors]
  );

  const capabilityOptions = useMemo(
    () => [
      { label: "All capabilities", value: "" },
      ...((filterOptions?.capabilities ?? []).map((capability) => ({ label: capability, value: capability })))
    ],
    [filterOptions?.capabilities]
  );

  const licenseOptions = useMemo(
    () => [
      { label: "All licenses", value: "" },
      ...((filterOptions?.licenses ?? []).map((license) => ({ label: license, value: license })))
    ],
    [filterOptions?.licenses]
  );

  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDelete = async (modelId: number) => {
    await client.delete(`/api/admin/models/${modelId}`);
    await refetch();
  };

  const handleExport = useCallback(async () => {
    setExportError(null);
    setIsExporting(true);
    try {
      const items = await client.get<any[]>("/api/admin/models/export");
      const payload = { items };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      link.href = url;
      link.download = `models-export-${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Failed to export models");
    } finally {
      setIsExporting(false);
    }
  }, []);

  const handleFileSelect = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setImportText(text);
      setImportError(null);
      setImportResult(null);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "无法读取文件内容");
    } finally {
      event.target.value = "";
    }
  }, []);

  const parseImportPayload = (raw: string) => {
    if (!raw.trim()) {
      throw new Error("请先提供包含批量数据的 JSON 内容");
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new Error("JSON 格式无效，请检查后重新尝试");
    }

    const extractItems = (value: unknown): any[] => {
      if (Array.isArray(value)) return value;
      if (value && typeof value === "object" && Array.isArray((value as { items?: unknown }).items)) {
        return (value as { items: any[] }).items;
      }
      return [];
    };

    const items = extractItems(parsed);
    if (items.length === 0) {
      throw new Error("未找到可导入的数据。请提供包含 items 数组的 JSON");
    }

    return items.map((item) => {
      if (!item || typeof item !== "object") {
        return item;
      }
      const record = { ...item } as Record<string, unknown>;
      if (!record.vendorName && typeof record.vendor_name === "string") {
        record.vendorName = record.vendor_name;
      }
      if (!record.vendorModelId && typeof record.vendor_model_id === "string") {
        record.vendorModelId = record.vendor_model_id;
      }
      return record;
    });
  };

  const handleImport = useCallback(async () => {
    setImportError(null);
    setImportResult(null);
    setIsImporting(true);
    try {
      const items = parseImportPayload(importText);
      const result = await client.post<ImportResult>("/api/admin/models/import", { items });
      setImportResult(result);
      setImportText("");
      await refetch();
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "批量导入失败，请稍后重试");
    } finally {
      setIsImporting(false);
    }
  }, [importText, refetch]);

  const updateFilter = <K extends keyof ModelFilterValues>(field: K, value: ModelFilterValues[K]) => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Models</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage catalog entries and their pricing structures.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={handleExport} disabled={isExporting}>
            {isExporting ? "Exporting..." : "Export"}
          </Button>
          <Button
            variant={showImportPanel ? "ghost" : "secondary"}
            onClick={() => {
              setShowImportPanel((current) => !current);
              setImportError(null);
              setImportResult(null);
            }}
          >
            {showImportPanel ? "Cancel import" : "Import"}
          </Button>
          <Button onClick={() => router.push("/admin/dashboard/models/new")}>Add model</Button>
        </div>
      </div>
      <Card
        title="Filters"
        description="Narrow down models by vendor, capabilities, licensing, and pricing."
        actions={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setFilters({ ...defaultFilters })}
            disabled={filtersLoading}
          >
            Reset filters
          </Button>
        }
      >
        <form className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Input
            label="Search"
            value={filters.search}
            onChange={(event) => updateFilter("search", event.target.value)}
            placeholder="Model or vendor"
          />
          <Select
            label="Vendor"
            value={filters.vendorName}
            onChange={(event) => updateFilter("vendorName", event.target.value)}
            options={vendorOptions}
            disabled={filtersLoading}
          />
          <Select
            label="Capability"
            value={filters.capability}
            onChange={(event) => updateFilter("capability", event.target.value)}
            options={capabilityOptions}
            disabled={filtersLoading}
          />
          <Select
            label="License"
            value={filters.license}
            onChange={(event) => updateFilter("license", event.target.value)}
            options={licenseOptions}
            disabled={filtersLoading}
          />
          <Select
            label="Pricing model"
            value={filters.priceModel}
            onChange={(event) => updateFilter("priceModel", event.target.value)}
            options={priceModelOptions}
          />
          <Select
            label="Currency"
            value={filters.priceCurrency}
            onChange={(event) => updateFilter("priceCurrency", event.target.value)}
            options={currencyOptions}
          />
        </form>
      </Card>
      {exportError && <p className="text-sm text-rose-500">{exportError}</p>}
      {showImportPanel && (
        <Card
          title="Bulk import"
          description="Upload a JSON file or paste JSON data to create and update models in bulk."
          actions={
            <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
              Upload JSON
            </Button>
          }
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleFileSelect}
          />
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              The payload should include the vendor name (<code className="font-mono text-xs">vendorName</code>) and the vendor model
              identifier (<code className="font-mono text-xs">vendorModelId</code>) for each item so the system can match existing
              records.
            </p>
            <textarea
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
              placeholder='{"items": [{"vendorName": "Example Vendor", "model": "My Model", "vendorModelId": "abc-123"}]}'
              className="h-48 w-full rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-700 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setImportText("");
                  setImportError(null);
                  setImportResult(null);
                }}
              >
                Clear
              </Button>
              <Button onClick={handleImport} disabled={isImporting}>
                {isImporting ? "Importing..." : "Import models"}
              </Button>
            </div>
            {importError && <p className="text-sm text-rose-500">{importError}</p>}
            {importResult && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-700/50 dark:bg-emerald-900/40 dark:text-emerald-200">
                <p>
                  Created: <span className="font-semibold">{importResult.created}</span>, Updated: <span className="font-semibold">{importResult.updated}</span>
                </p>
                {importResult.errors.length > 0 && (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-rose-600 dark:text-rose-300">
                    {importResult.errors.map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </Card>
      )}
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
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  <PriceDisplay
                    price={{
                      price_model: readField<string>(model, "price_model", "priceModel"),
                      price_currency: readField<string>(model, "price_currency", "priceCurrency"),
                      price_data: readField<Record<string, unknown>>(model, "price_data", "priceData")
                    }}
                    variant="compact"
                  />
                </div>
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
