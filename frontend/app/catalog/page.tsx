"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ModelFilterPanel, ModelFilterValues } from "../../components/catalog/ModelFilterPanel";
import { ModelList } from "../../components/catalog/ModelList";
import { useModels } from "../../lib/hooks/useModels";
import { Select } from "../../components/ui/Select";
import { useFilterPanelStore } from "../../lib/hooks/useFilterPanel";
import { Pagination } from "../../components/ui/Pagination";
import { MODEL_CATEGORIES } from "../../lib/constants";
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

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export default function CatalogPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [filters, setFilters] = useState<ModelFilterValues>({ ...defaultModelFilters });
  const [sort, setSort] = useState<string>(defaultCatalogSort);
  const [page, setPage] = useState<number>(1);
  const [selectedModelIds, setSelectedModelIds] = useState<number[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const { toggle, isOpen, close, setHasActiveFilters, hasActiveFilters } = useFilterPanelStore();

  const updateSearchParams = useCallback(
    (nextFilters: ModelFilterValues, nextSort: string, nextPage: number) => {
      const params = createCatalogSearchParams(nextFilters, nextSort, nextPage);
      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    },
    [pathname, router]
  );

  useEffect(() => {
    const params = searchParams ? new URLSearchParams(searchParams.toString()) : new URLSearchParams();
    const { filters: nextFilters, sort: nextSort, page: nextPage } = parseCatalogSearchParams(params);
    setFilters((current) => (filtersAreEqual(current, nextFilters) ? current : nextFilters));
    setSort((current) => (current === nextSort ? current : nextSort));
    setPage((current) => (current === nextPage ? current : nextPage));
  }, [searchParams]);

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
      setPage(1);
      updateSearchParams(next, sort, 1);
      return next;
    });
  };

  const handleLicenseSelect = (license: string) => {
    setFilters((current) => {
      const next = {
        ...current,
        license: current.license === license ? "" : license
      };
      setPage(1);
      updateSearchParams(next, sort, 1);
      return next;
    });
  };

  const handleFilterPanelChange = (nextValues: ModelFilterValues) => {
    setFilters(nextValues);
    setPage(1);
    updateSearchParams(nextValues, sort, 1);
  };

  const handleResetFilters = () => {
    setFilters({ ...defaultModelFilters });
    setSort(defaultCatalogSort);
    setPage(1);
    updateSearchParams(defaultModelFilters, defaultCatalogSort, 1);
  };

  const handleCategoryChange = (category: string) => {
    setFilters((current) => {
      const nextCategory = current.category === category ? "" : category;
      const next = {
        ...current,
        category: nextCategory
      };
      setPage(1);
      updateSearchParams(next, sort, 1);
      return next;
    });
  };

  const handleSortChange = (value: string) => {
    setSort(value);
    setPage(1);
    updateSearchParams(filters, value, 1);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    updateSearchParams(filters, sort, nextPage);
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
      updateSearchParams(filters, sort, totalPages);
    }
  }, [filters, page, query.data, sort, totalPages, updateSearchParams]);

  const categoryTabs = useMemo(
    () => [{ value: "", label: "All" }, ...MODEL_CATEGORIES.map((item) => ({ value: item.value, label: item.label }))],
    []
  );

  return (
    <div className="relative space-y-8">
      {isOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
          <button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            onClick={close}
          />
          <div
            className="relative z-50 w-full max-w-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <ModelFilterPanel values={filters} onChange={handleFilterPanelChange} onReset={handleResetFilters} />
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
          <Button type="button" variant="primary" size="sm" onClick={() => setIsCompareOpen(true)}>
            Compare{selectedModelIds.length ? ` (${selectedModelIds.length})` : ""}
              </Button>
            }
            toolbarRight={
              <div className="flex flex-wrap items-center justify-end gap-3">
                <span className="text-sm text-slate-500 dark:text-slate-400">{query.data?.total ?? 0} results</span>
                <CurrencySelector size="sm" />
                <PricingUnitSelector size="sm" />
                <Select
                  aria-label="Sort models"
                  value={sort}
                  onChange={(event) => handleSortChange(event.target.value)}
                  options={catalogSortOptions}
                />
                <Button
                  variant={isOpen ? "primary" : hasActiveFilters ? "secondary" : "ghost"}
                  size="sm"
                  onClick={toggle}
                  aria-label="Search and filter models"
                  aria-pressed={isOpen}
                  className="px-2"
                >
                  <SearchIcon
                    className={["h-4 w-4", isOpen ? "text-white" : hasActiveFilters ? "text-primary" : ""].filter(Boolean).join(" ")}
                  />
                </Button>
              </div>
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
