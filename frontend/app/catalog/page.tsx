"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ModelFilterPanel, ModelFilterValues } from "../../components/catalog/ModelFilterPanel";
import { ModelList } from "../../components/catalog/ModelList";
import { useModels } from "../../lib/hooks/useModels";
import { Select } from "../../components/ui/Select";
import { useFilterPanelStore } from "../../lib/hooks/useFilterPanel";
import { Pagination } from "../../components/ui/Pagination";
import { Button } from "../../components/ui/Button";
import { CurrencySelector } from "../../components/currency/CurrencySelector";
import { PricingUnitSelector } from "../../components/pricing/PricingUnitSelector";

import {
  catalogSortOptions,
  createCatalogSearchParams,
  defaultCatalogSort,
  defaultModelFilters,
  filtersAreEqual,
  parseCatalogSearchParams
} from "../../lib/catalogFilters";
import { CompareModelsModal } from "../../components/catalog/CompareModelsModal";

const MAX_COMPARE_SELECTIONS = 5;

export default function CatalogPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [filters, setFilters] = useState<ModelFilterValues>({ ...defaultModelFilters });
  const [sort, setSort] = useState<string>(defaultCatalogSort);
  const [page, setPage] = useState<number>(1);
  const [selectedModelIds, setSelectedModelIds] = useState<number[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { setHasActiveFilters } = useFilterPanelStore();

  // Sync URL params to state on mount and URL changes
  useEffect(() => {
    const params = searchParams ? new URLSearchParams(searchParams.toString()) : new URLSearchParams();
    const { filters: nextFilters, sort: nextSort, page: nextPage } = parseCatalogSearchParams(params);
    setFilters((current) => (filtersAreEqual(current, nextFilters) ? current : nextFilters));
    setSort((current) => (current === nextSort ? current : nextSort));
    setPage((current) => (current === nextPage ? current : nextPage));
    setIsInitialized(true);
  }, [searchParams]);

  // Sync state to URL params after initialization
  useEffect(() => {
    if (!isInitialized) return;
    
    const params = createCatalogSearchParams(filters, sort, page);
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [filters, sort, page, pathname, router, isInitialized]);

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
    return baseChecks.some(Boolean) || sort !== defaultCatalogSort;
  }, [filters, sort]);

  useEffect(() => {
    setHasActiveFilters(hasFilters);
  }, [hasFilters, setHasActiveFilters]);

  const handleCapabilitySelect = (capability: string) => {
    setFilters((current) => {
      const next = {
        ...current,
        capability: current.capability === capability ? "" : capability
      };
      return next;
    });
    setPage(1);
  };

  const handleLicenseSelect = (license: string) => {
    setFilters((current) => {
      const next = {
        ...current,
        license: current.license === license ? "" : license
      };
      return next;
    });
    setPage(1);
  };

  const handleFilterPanelChange = (nextValues: ModelFilterValues) => {
    setFilters(nextValues);
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({ ...defaultModelFilters });
    setSort(defaultCatalogSort);
    setPage(1);
  };

  const handleSortChange = (value: string) => {
    setSort(value);
    setPage(1);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
  };

  const toggleModelSelection = (modelId: number) => {
    setSelectedModelIds((current) => {
      if (current.includes(modelId)) {
        return current.filter((id) => id !== modelId);
      }
      if (current.length >= MAX_COMPARE_SELECTIONS) {
        return current;
      }
      return [...current, modelId];
    });
  };

  const handleCompareConfirm = () => {
    if (selectedModelIds.length < 2) {
      return;
    }
    const params = createCatalogSearchParams(filters, sort, page);
    const filtersParam = params.toString();
    const queryParams = new URLSearchParams();
    queryParams.set("models", selectedModelIds.join(","));
    if (filtersParam) {
      queryParams.set("filters", filtersParam);
    }
    router.push(`/catalog/compare?${queryParams.toString()}`);
    setIsCompareOpen(false);
  };

  const totalResults = query.data?.total ?? 0;
  const pageSize = query.data?.page_size ?? 20;
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));

  useEffect(() => {
    if (!query.data) {
      return;
    }
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, query.data, totalPages]);

  return (
    <div className="relative space-y-8">
      <div className="space-y-6">
        <ModelFilterPanel
          variant="inline"
          values={filters}
          onChange={handleFilterPanelChange}
          onReset={handleResetFilters}
        />

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
            toolbarLeft={
              <>
                <span className="text-sm text-slate-500 dark:text-slate-400">{query.data?.total ?? 0} results</span>
                {hasFilters ? (
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    Filters applied
                  </span>
                ) : null}
              </>
            }
            toolbarRight={
              <>
                <CurrencySelector size="sm" />
                <PricingUnitSelector size="sm" />
                <Select
                  aria-label="Sort models"
                  value={sort}
                  onChange={(event) => handleSortChange(event.target.value)}
                  fieldSize="sm"
                  className="w-auto min-w-[11rem]"
                  options={catalogSortOptions}
                />
                <Button type="button" variant="primary" size="sm" onClick={() => setIsCompareOpen(true)}>
                  Compare{selectedModelIds.length ? ` (${selectedModelIds.length})` : ""}
                </Button>
              </>
            }
            onSelectCapability={handleCapabilitySelect}
            onSelectLicense={handleLicenseSelect}
          />
        )}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
          </div>
        )}
      </div>

      <CompareModelsModal
        open={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        selectedModelIds={selectedModelIds}
        onToggleModel={toggleModelSelection}
        onConfirm={handleCompareConfirm}
        maxSelections={MAX_COMPARE_SELECTIONS}
        defaultFilters={{ category: filters.category }}
      />
    </div>
  );
}
