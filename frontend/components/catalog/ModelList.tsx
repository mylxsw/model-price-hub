import Link from "next/link";

import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";

export interface CatalogModel {
  id: number;
  model: string;
  description?: string;
  vendor: { id: number; name: string };
  price_model?: string;
  price_currency?: string;
  model_capability?: string[];
  price_data?: Record<string, unknown>;
}

interface ModelListProps {
  models: CatalogModel[];
}

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

export function ModelList({ models }: ModelListProps) {
  if (!models.length) {
    return <Card title="No models found">Try adjusting your filters or search query.</Card>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {models.map((model) => (
        <Card
          key={model.id}
          title={model.model}
          description={model.description}
          actions={<Badge color="primary">{model.vendor.name}</Badge>}
        >
          <div className="mt-4 flex flex-col gap-3 text-sm text-slate-300">
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
              <span>Pricing</span>
              <span>{prettyPricing(model)}</span>
            </div>
            {model.model_capability && model.model_capability.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {model.model_capability.map((capability) => (
                  <Badge key={capability} color="secondary">
                    {capability}
                  </Badge>
                ))}
              </div>
            )}
            <Link href={`/catalog/${model.id}`} className="text-sm text-primary hover:text-primary-dark">
              View details →
            </Link>
          </div>
        </Card>
      ))}
    </div>
  );
}
