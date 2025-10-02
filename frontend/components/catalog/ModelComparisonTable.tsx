import Link from "next/link";

import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { CatalogModel, formatReleaseDate, normalizeStringArray } from "./ModelList";
import { PriceDisplay } from "./PriceDisplay";

interface ModelComparisonTableProps {
  models: CatalogModel[];
  onRemoveModel?: (modelId: number) => void;
  onClear?: () => void;
}

export function ModelComparisonTable({ models, onRemoveModel, onClear }: ModelComparisonTableProps) {
  return (
    <Card
      title="Model comparison"
      description="Evaluate models side by side to find the best fit."
      actions={
        onClear && (
          <Button variant="secondary" size="sm" onClick={onClear}>
            Clear selection
          </Button>
        )
      }
    >
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
          <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
            <tr>
              <th scope="col" className="px-4 py-3">
                Feature
              </th>
              {models.map((model) => (
                <th key={model.id} scope="col" className="min-w-[220px] px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/catalog/${model.id}`}
                        className="text-sm font-semibold text-slate-700 transition-colors hover:text-primary dark:text-slate-100"
                      >
                        {model.model}
                      </Link>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{model.vendor.name}</div>
                    </div>
                    {onRemoveModel && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveModel(model.id)}
                        aria-label={`Remove ${model.model} from comparison`}
                        className="px-2 py-1 text-base leading-none"
                      >
                        ×
                      </Button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm text-slate-600 dark:divide-slate-800 dark:text-slate-300">
            <tr>
              <th scope="row" className="whitespace-nowrap px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                Pricing
              </th>
              {models.map((model) => (
                <td key={model.id} className="px-4 py-4 align-top">
                  <PriceDisplay
                    price={{
                      price_model: model.priceModel,
                      price_currency: model.priceCurrency,
                      price_data: model.priceData
                    }}
                    variant="compact"
                  />
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row" className="whitespace-nowrap px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                Capabilities
              </th>
              {models.map((model) => {
                const capabilities = normalizeStringArray(model.modelCapability);
                return (
                  <td key={model.id} className="px-4 py-4 align-top">
                    {capabilities.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {capabilities.map((capability) => (
                          <Badge key={capability} color="secondary">
                            {capability}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500">No data</span>
                    )}
                  </td>
                );
              })}
            </tr>
            <tr>
              <th scope="row" className="whitespace-nowrap px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                Licenses
              </th>
              {models.map((model) => {
                const licenses = normalizeStringArray(model.license);
                return (
                  <td key={model.id} className="px-4 py-4 align-top">
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
                );
              })}
            </tr>
            <tr>
              <th scope="row" className="whitespace-nowrap px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                Release
              </th>
              {models.map((model) => (
                <td key={model.id} className="px-4 py-4 align-top">
                  {formatReleaseDate(model.release_date) ? (
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      {formatReleaseDate(model.release_date)}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-slate-500">Pending</span>
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row" className="whitespace-nowrap px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                Highlights
              </th>
              {models.map((model) => (
                <td key={model.id} className="px-4 py-4 align-top">
                  {model.description ? (
                    <p className="text-sm text-slate-600 dark:text-slate-300">{model.description}</p>
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}
