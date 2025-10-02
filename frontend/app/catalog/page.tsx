"use client";

import { useMemo, useState } from "react";

import { ModelFilterPanel, ModelFilterValues } from "../../components/catalog/ModelFilterPanel";
import { ModelList } from "../../components/catalog/ModelList";
import { useModels } from "../../lib/hooks/useModels";
import { Select } from "../../components/ui/Select";

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

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 lg:flex-row">
      <ModelFilterPanel
        values={filters}
        onChange={setFilters}
        onReset={() => {
          setFilters(defaultFilters);
          setSort(sortOptions[0]?.value ?? "release_desc");
        }}
      />
      <div className="flex-1 space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Model catalog</h1>
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
          <ModelList models={models} />
        )}
      </div>
    </div>
  );
}
