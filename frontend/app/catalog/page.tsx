"use client";

import { useEffect, useMemo, useState } from "react";

import { ModelFilterPanel, ModelFilterValues } from "../../components/catalog/ModelFilterPanel";
import { ModelList } from "../../components/catalog/ModelList";
import { useModels } from "../../lib/hooks/useModels";
import { Select } from "../../components/ui/Select";
import { useFilterPanelStore } from "../../lib/hooks/useFilterPanel";
import { ModelComparisonTable } from "../../components/catalog/ModelComparisonTable";
import { useLayoutModeStore } from "../../lib/hooks/useLayoutMode";

const defaultFilters: ModelFilterValues = {
  search: "",
  vendorName: "",
  priceModel: "",
  priceCurrency: "",
  capability: "",
  license: ""
};

const sortOptions = [
  { label: "Release date (newest)", value: "release_desc" },
  { label: "Release date (oldest)", value: "release_asc" },
  { label: "Price (low to high)", value: "price_asc" },
  { label: "Price (high to low)", value: "price_desc" },
  { label: "Vendor (A-Z)", value: "vendor_asc" },
  { label: "Model name (A-Z)", value: "model_asc" },
  { label: "Model name (Z-A)", value: "model_desc" }
];

export default function CatalogPage() {
  const [filters, setFilters] = useState<ModelFilterValues>(defaultFilters);
  const [sort, setSort] = useState<string>(sortOptions[0]?.value ?? "release_desc");
  const [selectedModelIds, setSelectedModelIds] = useState<number[]>([]);
  const { isOpen, close } = useFilterPanelStore();
  const layoutMode = useLayoutModeStore((state) => state.mode);
  const overlayWidthClasses = [
    "mx-auto flex w-full",
    layoutMode === "centered" ? "max-w-7xl" : "",
    "justify-end px-4 sm:px-6"
  ]
    .filter(Boolean)
    .join(" ");
  const query = useModels({
    search: filters.search,
    vendorName: filters.vendorName,
    priceModel: filters.priceModel,
    priceCurrency: filters.priceCurrency,
    capability: filters.capability,
    license: filters.license,
    sort
  });

  const models = useMemo(() => query.data?.items ?? [], [query.data]);
  const selectedModels = useMemo(
    () => models.filter((model) => selectedModelIds.includes(model.id)),
    [models, selectedModelIds]
  );

  useEffect(() => {
    setSelectedModelIds((current) => current.filter((id) => models.some((model) => model.id === id)));
  }, [models]);

  const handleToggleModel = (modelId: number) => {
    setSelectedModelIds((current) =>
      current.includes(modelId) ? current.filter((id) => id !== modelId) : [...current, modelId]
    );
  };

  return (
    <div className="relative space-y-8">
      {isOpen && (
        <div className="fixed inset-0 z-40 flex items-start justify-end bg-slate-950/40 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0 cursor-default"
            onClick={close}
          />
          <div
            className="relative z-50 mt-24 w-full pb-8 lg:mt-28"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={overlayWidthClasses}>
              <div className="w-full max-w-md">
                <ModelFilterPanel
                  values={filters}
                  onChange={setFilters}
                  onReset={() => {
                    setFilters(defaultFilters);
                    setSort(sortOptions[0]?.value ?? "release_desc");
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Search and filter foundation and fine-tuned models from global vendors.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <span className="text-sm text-slate-500 dark:text-slate-400">{query.data?.total ?? 0} results</span>
            <Select
              aria-label="Sort models"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              options={sortOptions}
            />
          </div>
        </div>
        {query.isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white/90 p-10 text-center text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
            Loading models...
          </div>
        ) : query.isError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600 dark:border-rose-500/50 dark:bg-rose-500/10 dark:text-rose-200">
            Failed to load models. Please try again later.
          </div>
        ) : (
          <ModelList
            models={models}
            selectedModelIds={selectedModelIds}
            onToggleCompare={handleToggleModel}
          />
        )}
      </div>

      {selectedModels.length >= 2 && (
        <ModelComparisonTable
          models={selectedModels}
          onRemoveModel={(modelId) =>
            setSelectedModelIds((current) => current.filter((id) => id !== modelId))
          }
          onClear={() => setSelectedModelIds([])}
        />
      )}
    </div>
  );
}
