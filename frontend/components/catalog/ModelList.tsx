import Link from "next/link";

import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";

export interface CatalogModel {
  id: number;
  model: string;
  description?: string;
  vendor: { id: number; name: string };
  price_model?: string;
  price_currency?: string;
  model_capability?: unknown;
  price_data?: Record<string, unknown>;
  license?: unknown;
  release_date?: string | null;
}

interface ModelListProps {
  models: CatalogModel[];
}

const normalizeStringArray = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
      }
    } catch (error) {
      // ignore parse errors and fall back to raw string
    }
    return value.trim() ? [value.trim()] : [];
  }
  return [];
};

const prettyPricing = (model: CatalogModel) => {
  if (!model.price_model) return "Pricing unknown";
  switch (model.price_model) {
    case "token":
      return `${model.price_currency ?? ""} per token`;
    case "call":
      return `${model.price_currency ?? ""} per call`;
    case "tiered":
      return `${model.price_currency ?? ""} tiered pricing`;
    default:
      return model.price_model;
  }
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
        const capabilities = normalizeStringArray(model.model_capability);
        const licenses = normalizeStringArray(model.license);
        const releaseDate = formatReleaseDate(model.release_date);

        return (
          <Card
            key={model.id}
            title={model.model}
            description={model.description}
            actions={<Badge color="primary">{model.vendor.name}</Badge>}
        >
          <div className="mt-4 flex flex-col gap-3 text-sm text-slate-600 dark:text-slate-300">
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <span>Pricing</span>
              <span>{prettyPricing(model)}</span>
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
