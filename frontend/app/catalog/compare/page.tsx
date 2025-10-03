"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "../../../components/ui/Button";
import { ModelComparisonTable } from "../../../components/catalog/ModelComparisonTable";
import type { CatalogModel } from "../../../components/catalog/ModelList";
import { useModelsByIds } from "../../../lib/hooks/useModels";

export default function CatalogComparePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const modelsParam = searchParams.get("models") ?? "";
  const filtersParam = searchParams.get("filters") ?? "";

  const modelIds = useMemo(() => {
    return modelsParam
      .split(",")
      .map((value) => Number.parseInt(value, 10))
      .filter((value) => Number.isInteger(value) && value > 0);
  }, [modelsParam]);

  const { data: models = [], isLoading, isError } = useModelsByIds(modelIds);

  const handleNavigateToCatalog = () => {
    if (filtersParam) {
      router.push(`/catalog?${filtersParam}`);
    } else {
      router.push("/catalog");
    }
  };

  const updateComparedModels = (ids: number[]) => {
    if (ids.length === 0) {
      handleNavigateToCatalog();
      return;
    }
    const query = new URLSearchParams();
    query.set("models", ids.join(","));
    if (filtersParam) {
      query.set("filters", filtersParam);
    }
    router.replace(`/catalog/compare?${query.toString()}`);
  };

  const handleRemoveModel = (modelId: number) => {
    const nextIds = modelIds.filter((id) => id !== modelId);
    updateComparedModels(nextIds);
  };

  const handleClear = () => {
    updateComparedModels([]);
  };

  const heading = (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center justify-between w-full gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Model comparison</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Review pricing, capabilities, and release information side by side.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={handleNavigateToCatalog}>
          ← Back
        </Button>
      </div>
    </div>
  );

  if (modelIds.length === 0) {
    return (
      <div className="space-y-6">
        {heading}
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          No models selected for comparison. Return to the catalog to choose models.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {heading}
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          Loading comparison data...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        {heading}
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-600 shadow-sm dark:border-rose-500/50 dark:bg-rose-500/10 dark:text-rose-100">
          Unable to load the selected models. Please return to the catalog and try again.
        </div>
      </div>
    );
  }

  if (models.length < 2) {
    return (
      <div className="space-y-6">
        {heading}
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          Select at least two models to see a detailed comparison.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {heading}
      <ModelComparisonTable models={models as CatalogModel[]} onRemoveModel={handleRemoveModel} onClear={handleClear} />
    </div>
  );
}
