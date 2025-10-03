import Link from "next/link";

import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { PriceDisplay } from "./PriceDisplay";

interface CatalogVendor {
  id: number;
  name: string;
  vendor_image?: string | null;
  vendorImage?: string | null;
  image?: string | null;
}

export interface CatalogModel {
  id: number;
  model: string;
  description?: string;
  vendor: CatalogVendor;
  priceModel?: string;
  priceCurrency?: string;
  modelCapability?: unknown;
  priceData?: Record<string, unknown>;
  license?: unknown;
  release_date?: string | null;
  vendor_image?: string | null;
  vendorImage?: string | null;
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

const getVendorImage = (model: CatalogModel): string | null => {
  const fromVendor = model.vendor?.vendor_image ?? model.vendor?.vendorImage ?? model.vendor?.image ?? null;
  const extras = model as Record<string, unknown>;
  const extraImage = extras.vendor_image ?? extras.vendorImage ?? extras.vendorLogo;
  const fromModel = typeof extraImage === "string" ? extraImage : null;
  return fromVendor ?? fromModel ?? null;
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
              <th scope="col" className="w-28 px-3 py-3">
                Compare
              </th>
              <th scope="col" className="w-32 px-3 py-3 text-center">
                Vendor
              </th>
              <th scope="col" className="px-4 py-3">
                Model details
              </th>
              <th scope="col" className="px-4 py-3">
                Pricing snapshot
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
              const vendorName = model.vendor?.name ?? "Unknown vendor";
              const vendorImage = getVendorImage(model);
              const vendorInitial = vendorName.charAt(0).toUpperCase();
              const hasMetadata = capabilities.length > 0 || licenses.length > 0;

              return (
                <tr
                  key={model.id}
                  className="transition hover:bg-slate-50/80 dark:hover:bg-slate-900/40"
                >
                  <td className="w-28 px-3 py-4 align-top">
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
                  <td className="w-32 px-3 py-4 align-top text-center">
                    <div className="flex flex-col items-center gap-2">
                      <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {vendorImage ? (
                          <img src={vendorImage} alt={vendorName} className="h-full w-full object-fill" />
                        ) : (
                          vendorInitial
                        )}
                      </span>
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-200">{vendorName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/catalog/${model.id}`}
                          className="text-base font-semibold text-slate-800 transition-colors hover:text-primary dark:text-slate-100"
                        >
                          {model.model}
                        </Link>
                        {model.description && (
                          <div className="group relative inline-flex">
                            <button
                              type="button"
                              className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 bg-white text-xs font-semibold text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                              aria-label={`View description for ${model.model}`}
                              title={model.description}
                            >
                              ?
                            </button>
                            <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 hidden w-64 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600 shadow-lg group-hover:block group-focus-within:block dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                              {model.description}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {capabilities.map((capability) => (
                          <Badge key={capability} color="secondary">
                            {capability}
                          </Badge>
                        ))}
                        {licenses.map((license) => (
                          <Badge key={license} color="success">
                            {license}
                          </Badge>
                        ))}
                        {!hasMetadata && (
                          <span className="text-xs text-slate-400 dark:text-slate-500">No additional details</span>
                        )}
                      </div>
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
