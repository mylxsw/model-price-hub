"use client";

import { useMemo, useState } from "react";

import { ModelFilterPanel, ModelFilterValues } from "../../components/catalog/ModelFilterPanel";
import { ModelList } from "../../components/catalog/ModelList";
import { useModels } from "../../lib/hooks/useModels";

const defaultFilters: ModelFilterValues = {
  search: "",
  vendorName: "",
  priceModel: "",
  priceCurrency: "",
  capability: "",
  license: ""
};

export default function CatalogPage() {
  const [filters, setFilters] = useState<ModelFilterValues>(defaultFilters);
  const query = useModels({
    search: filters.search,
    vendorName: filters.vendorName,
    priceModel: filters.priceModel,
    priceCurrency: filters.priceCurrency,
    capability: filters.capability,
    license: filters.license
  });

  const models = useMemo(() => query.data?.items ?? [], [query.data]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 lg:flex-row">
      <ModelFilterPanel
        values={filters}
        onChange={setFilters}
        onReset={() => {
          setFilters(defaultFilters);
        }}
      />
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Model catalog</h1>
            <p className="text-sm text-slate-400">Search and filter foundation and fine-tuned models from global vendors.</p>
          </div>
          <span className="text-sm text-slate-400">{query.data?.total ?? 0} results</span>
        </div>
        {query.isLoading ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-10 text-center text-sm text-slate-400">
            Loading models...
          </div>
        ) : query.isError ? (
          <div className="rounded-xl border border-rose-500/50 bg-rose-500/10 p-6 text-sm text-rose-200">
            Failed to load models. Please try again later.
          </div>
        ) : (
          <ModelList models={models} />
        )}
      </div>
    </div>
  );
}
