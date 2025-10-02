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
}

const normalizeStringArray = (value: unknown): string[] => {
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


const formatReleaseDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en", { year: "numeric", month: "short" }).format(date);
};

export function ModelList({ models }: ModelListProps) {
  if (!models.length) {
    return <Card title="No models found">Try adjusting your filters or search query.</Card>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {models.map((model) => {
        const capabilities = normalizeStringArray(model.modelCapability);
        const licenses = normalizeStringArray(model.license);
        const releaseDate = formatReleaseDate(model.release_date);

        
        return (
          <Card
            key={model.id}
            title={
              <Link
                href={`/catalog/${model.id}`}
                className="text-inherit transition-colors hover:text-primary hover:underline"
              >
                {model.model}
              </Link>
            }
            description={model.description}
            actions={<Badge color="primary">{model.vendor.name}</Badge>}
          >
            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <span>Pricing</span>
                <PriceDisplay
                  price={{
                    price_model: model.priceModel,
                    price_currency: model.priceCurrency,
                    price_data: model.priceData
                  }}
                  variant="compact"
                />
              </div>
              {releaseDate && (
                <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <span>Released</span>
                  <span>{releaseDate}</span>
                </div>
              )}
              {capabilities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {capabilities.map((capability) => (
                    <Badge key={capability} color="secondary">
                      {capability}
                    </Badge>
                  ))}
                </div>
              )}
              {licenses.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {licenses.map((license) => (
                    <Badge key={license} color="success">
                      {license}
                    </Badge>
                  ))}
                </div>
              )}
              <Link href={`/catalog/${model.id}`} className="text-sm text-primary hover:text-primary-dark">
                View details →
              </Link>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
