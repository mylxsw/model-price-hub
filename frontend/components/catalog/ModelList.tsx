import Link from "next/link";

import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { PriceDisplay } from "./PriceDisplay";

export interface CatalogModel {
  id: number;
  model: string;
  description?: string;
  vendor: { id: number; name: string };
  priceModel?: string;
  priceCurrency?: string;
  modelCapability?: unknown;
  priceData?: Record<string, unknown>;
  license?: unknown;
  release_date?: string | null;
}

interface ModelListProps {
  models: CatalogModel[];
  selectedModelIds?: number[];
  onToggleCompare?: (modelId: number) => void;
}

export const normalizeStringArray = (value: unknown): string[] => {
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
        // ignore parse errors and fall back to the raw string
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


export const formatReleaseDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en", { year: "numeric", month: "short" }).format(date);
};

export function ModelList({ models, selectedModelIds = [], onToggleCompare }: ModelListProps) {
  if (!models.length) {
    return <Card title="No models found">Try adjusting your filters or search query.</Card>;
  }

  return (
    <Card className="p-0">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
          <thead className="bg-slate-50/80 dark:bg-slate-900/50">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <th scope="col" className="px-4 py-3">
                Compare
              </th>
              <th scope="col" className="px-4 py-3">
                Model details
              </th>
              <th scope="col" className="px-4 py-3">
                Pricing snapshot
              </th>
              <th scope="col" className="px-4 py-3">
                Capabilities
              </th>
              <th scope="col" className="px-4 py-3">
                Licenses
              </th>
              <th scope="col" className="px-4 py-3">
                Release
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm text-slate-600 dark:divide-slate-800 dark:text-slate-300">
            {models.map((model) => {
              const capabilities = normalizeStringArray(model.modelCapability);
              const licenses = normalizeStringArray(model.license);
              const releaseDate = formatReleaseDate(model.release_date);
              const isSelected = selectedModelIds.includes(model.id);

              return (
                <tr
                  key={model.id}
                  className="transition hover:bg-slate-50/80 dark:hover:bg-slate-900/40"
                >
                  <td className="px-4 py-4 align-top">
                    <label className="flex items-center gap-2 text-xs font-medium">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                        checked={isSelected}
                        onChange={() => onToggleCompare?.(model.id)}
                        aria-label={`Select ${model.model} for comparison`}
                      />
                      <span className="hidden text-slate-500 sm:inline">Compare</span>
                    </label>
                  </td>
                  <td className="max-w-xs px-4 py-4 align-top">
                    <div className="flex flex-col gap-2">
                      <div>
                        <Link
                          href={`/catalog/${model.id}`}
                          className="text-base font-semibold text-slate-800 transition-colors hover:text-primary dark:text-slate-100"
                        >
                          {model.model}
                        </Link>
                        <div className="mt-1 flex flex-wrap gap-2">
                          <Badge color="primary">{model.vendor.name}</Badge>
                          {model.priceModel && (
                            <Badge color="secondary">{model.priceModel}</Badge>
                          )}
                        </div>
                      </div>
                      {model.description && (
                        <p className="line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{model.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="w-64 px-4 py-4 align-top text-left">
                    <PriceDisplay
                      price={{
                        price_model: model.priceModel,
                        price_currency: model.priceCurrency,
                        price_data: model.priceData
                      }}
                      variant="compact"
                    />
                  </td>
                  <td className="px-4 py-4 align-top">
                    {capabilities.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {capabilities.slice(0, 3).map((capability) => (
                          <Badge key={capability} color="secondary">
                            {capability}
                          </Badge>
                        ))}
                        {capabilities.length > 3 && (
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            +{capabilities.length - 3} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500">No data</span>
                    )}
                  </td>
                  <td className="px-4 py-4 align-top">
                    {licenses.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {licenses.map((license) => (
                          <Badge key={license} color="success">
                            {license}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 align-top">
                    {releaseDate ? (
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{releaseDate}</span>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-4 align-top text-right">
                    <Link
                      href={`/catalog/${model.id}`}
                      className="text-sm font-medium text-primary hover:text-primary-dark"
                    >
                      View details →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
