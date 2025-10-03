"use client";

import { useEffect, useMemo, useState } from "react";

import { useModels, useModelFilterOptions } from "../../lib/hooks/useModels";
import { ModelFilterValues } from "./ModelFilterPanel";
import { defaultModelFilters, defaultCatalogSort, catalogSortOptions } from "../../lib/catalogFilters";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Pagination } from "../ui/Pagination";
import { Button } from "../ui/Button";

interface CompareModelsModalProps {
  open: boolean;
  onClose: () => void;
  selectedModelIds: number[];
  onToggleModel: (modelId: number) => void;
  onConfirm: () => void;
  maxSelections?: number;
}

const priceModelOptions = [
  { label: "All pricing", value: "" },
  { label: "Per token", value: "token" },
  { label: "Per call", value: "call" },
  { label: "Tiered", value: "tiered" },
  { label: "Free", value: "free" },
  { label: "Unknown", value: "unknown" }
];

export function CompareModelsModal({
  open,
  onClose,
  selectedModelIds,
  onToggleModel,
  onConfirm,
  maxSelections = 5
}: CompareModelsModalProps) {
  const [filters, setFilters] = useState<ModelFilterValues>({ ...defaultModelFilters });
  const [sort, setSort] = useState<string>(defaultCatalogSort);
  const [page, setPage] = useState<number>(1);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const { data: filterOptions } = useModelFilterOptions();

  const query = useModels({
    search: filters.search,
    vendorName: filters.vendorName,
    priceModel: filters.priceModel,
    capability: filters.capability,
    license: filters.license,
    categories: filters.category,
    sort,
    page
  });

  const models = useMemo(() => query.data?.items ?? [], [query.data]);
  const totalResults = query.data?.total ?? 0;
  const pageSize = query.data?.page_size ?? 20;
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));

  useEffect(() => {
    if (!open) {
      setSelectionError(null);
    }
  }, [open]);

  const updateFilters = <K extends keyof ModelFilterValues>(key: K, value: ModelFilterValues[K]) => {
    setFilters((current) => ({
      ...current,
      [key]: value
    }));
    setPage(1);
  };

  const handleToggle = (modelId: number) => {
    const alreadySelected = selectedModelIds.includes(modelId);
    if (!alreadySelected && selectedModelIds.length >= maxSelections) {
      setSelectionError(`You can select up to ${maxSelections} models.`);
      return;
    }
    setSelectionError(null);
    onToggleModel(modelId);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
  };

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

  const categoryOptions = useMemo(
    () => [
      { label: "All categories", value: "" },
      ...((filterOptions?.categories ?? []).map((category) => ({ label: category, value: category })))
    ],
    [filterOptions?.categories]
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Select models to compare"
      panelClassName="max-w-4xl"
    >
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Input
            label="Search"
            placeholder="Model or vendor"
            value={filters.search}
            onChange={(event) => updateFilters("search", event.target.value)}
          />
          <Select
            label="Vendor"
            value={filters.vendorName}
            onChange={(event) => updateFilters("vendorName", event.target.value)}
            options={vendorOptions}
          />
          <Select
            label="Capability"
            value={filters.capability}
            onChange={(event) => updateFilters("capability", event.target.value)}
            options={capabilityOptions}
          />
          <Select
            label="License"
            value={filters.license}
            onChange={(event) => updateFilters("license", event.target.value)}
            options={licenseOptions}
          />
          <Select
            label="Category"
            value={filters.category}
            onChange={(event) => updateFilters("category", event.target.value)}
            options={categoryOptions}
          />
          <Select
            label="Pricing model"
            value={filters.priceModel}
            onChange={(event) => updateFilters("priceModel", event.target.value)}
            options={priceModelOptions}
          />
          <Select
            label="Sort"
            value={sort}
            onChange={(event) => {
              setSort(event.target.value);
              setPage(1);
            }}
            options={catalogSortOptions}
          />
        </div>

        <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
          <span>
            Selected {selectedModelIds.length} / {maxSelections}
          </span>
          {selectionError && <span className="text-rose-500 dark:text-rose-300">{selectionError}</span>}
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
          {query.isLoading ? (
            <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">Loading models...</div>
          ) : query.isError ? (
            <div className="p-6 text-center text-sm text-rose-500 dark:text-rose-300">
              Failed to load models. Please adjust filters or try again later.
            </div>
          ) : models.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
              No models match the current filters.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50/70 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">
                <tr>
                  <th className="w-12 px-4 py-3">Select</th>
                  <th className="w-1/3 px-4 py-3">Vendor</th>
                  <th className="px-4 py-3">Model</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm text-slate-700 dark:divide-slate-800 dark:text-slate-200">
                {models.map((model) => {
                  const isChecked = selectedModelIds.includes(model.id);
                  return (
                    <tr
                      key={model.id}
                      className={[
                        "cursor-pointer transition",
                        isChecked ? "bg-primary/10 dark:bg-primary/20" : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      ].join(" ")}
                      onClick={() => handleToggle(model.id)}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                          checked={isChecked}
                          onChange={(event) => {
                            event.stopPropagation();
                            handleToggle(model.id);
                          }}
                          aria-label={`Select ${model.model} for comparison`}
                        />
                      </td>
                      <td className="px-4 py-3">{model.vendor?.name ?? "Unknown vendor"}</td>
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-100">{model.model}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Tip: You can compare up to {maxSelections} models at once.
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onConfirm}
              disabled={selectedModelIds.length < 2}
              className={selectedModelIds.length < 2 ? "opacity-60" : undefined}
            >
              Compare models
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
