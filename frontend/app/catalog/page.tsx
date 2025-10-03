"use client";

import { useEffect, useMemo, useState } from "react";

import { ModelFilterPanel, ModelFilterValues } from "../../components/catalog/ModelFilterPanel";
import { ModelList } from "../../components/catalog/ModelList";
import { useModels } from "../../lib/hooks/useModels";
import { Select } from "../../components/ui/Select";
import { useFilterPanelStore } from "../../lib/hooks/useFilterPanel";
import { ModelComparisonTable } from "../../components/catalog/ModelComparisonTable";
import { useLayoutModeStore } from "../../lib/hooks/useLayoutMode";
import { Pagination } from "../../components/ui/Pagination";
import { MODEL_CATEGORIES } from "../../lib/constants";

const defaultFilters: ModelFilterValues = {
  search: "",
  vendorName: "",
  priceModel: "",
  priceCurrency: "",
  capability: "",
  license: "",
  category: ""
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
  const [page, setPage] = useState<number>(1);
  const [selectedModelIds, setSelectedModelIds] = useState<number[]>([]);
  const { isOpen, close, setHasActiveFilters } = useFilterPanelStore();
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
    categories: filters.category,
    sort,
    page
  });

  const models = useMemo(() => query.data?.items ?? [], [query.data]);
  const selectedModels = useMemo(
    () => models.filter((model) => selectedModelIds.includes(model.id)),
    [models, selectedModelIds]
  );

  useEffect(() => {
    setSelectedModelIds((current) => current.filter((id) => models.some((model) => model.id === id)));
  }, [models]);

  const hasFilters = useMemo(() => {
    const baseChecks = [
      filters.search.trim(),
      filters.vendorName,
      filters.priceModel,
      filters.priceCurrency,
      filters.capability,
      filters.license,
      filters.category
    ];
    return baseChecks.some(Boolean) || sort !== (sortOptions[0]?.value ?? "release_desc");
  }, [filters, sort]);

  useEffect(() => {
    setHasActiveFilters(hasFilters);
  }, [hasFilters, setHasActiveFilters]);

  const handleToggleModel = (modelId: number) => {
    setSelectedModelIds((current) =>
      current.includes(modelId) ? current.filter((id) => id !== modelId) : [...current, modelId]
    );
  };

  const handleCapabilitySelect = (capability: string) => {
    setFilters((current) => ({
      ...current,
      capability: current.capability === capability ? "" : capability
    }));
    setPage(1);
  };

  const handleLicenseSelect = (license: string) => {
    setFilters((current) => ({
      ...current,
      license: current.license === license ? "" : license
    }));
    setPage(1);
  };

  const handleFilterPanelChange = (nextValues: ModelFilterValues) => {
    setFilters(nextValues);
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters(defaultFilters);
    setSort(sortOptions[0]?.value ?? "release_desc");
    setPage(1);
  };

  const handleCategoryChange = (category: string) => {
    setFilters((current) => ({
      ...current,
      category
    }));
    setPage(1);
  };

  const handleSortChange = (value: string) => {
    setSort(value);
    setPage(1);
  };

  const totalResults = query.data?.total ?? 0;
  const pageSize = query.data?.page_size ?? 20;
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const categoryTabs = useMemo(
    () => [{ value: "", label: "All" }, ...MODEL_CATEGORIES.map((item) => ({ value: item.value, label: item.label }))],
    []
  );

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
                <ModelFilterPanel values={filters} onChange={handleFilterPanelChange} onReset={handleResetFilters} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          {categoryTabs.map((tab) => {
            const isActive = filters.category === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => handleCategoryChange(tab.value)}
                className={[
                  "rounded-full px-4 py-2 text-sm font-medium transition",
                  isActive
                    ? "bg-primary text-white shadow"
                    : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                ].join(" ")}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
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
              onChange={(event) => handleSortChange(event.target.value)}
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
            onSelectCapability={handleCapabilitySelect}
            onSelectLicense={handleLicenseSelect}
          />
        )}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(nextPage) => setPage(nextPage)}
            />
          </div>
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
