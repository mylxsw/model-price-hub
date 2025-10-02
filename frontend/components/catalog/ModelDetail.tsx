import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";

interface ModelDetailProps {
  model: {
    id: number;
    model: string;
    description?: string;
    vendor: { id: number; name: string };
    model_capability?: unknown;
    price_data?: Record<string, unknown>;
    price_model?: string;
    price_currency?: string;
    license?: unknown;
    model_url?: string;
    note?: string;
    release_date?: string | null;
  };
}

const normalizeStringArray = (input?: unknown): string[] => {
  const expand = (value: unknown): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.flatMap((item) => expand(item));
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return [];
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed) || typeof parsed === "string") {
          return expand(parsed);
        }
      } catch (error) {
        // ignore JSON parse errors and fall through to raw string
      }
      return [trimmed];
    }
    return [];
  };

  const deduped: string[] = [];
  for (const entry of expand(input)) {
    const normalized = entry.trim();
    if (normalized && !deduped.includes(normalized)) {
      deduped.push(normalized);
    }
  }
  return deduped;
};

function renderPricing(priceData?: Record<string, unknown> | string) {
  let data: Record<string, unknown> | null = null;

  if (typeof priceData === "string") {
    try {
      data = JSON.parse(priceData) as Record<string, unknown>;
    } catch (error) {
      data = null;
    }
  } else {
    data = priceData ?? null;
  }

  if (!data) return <p className="text-sm text-slate-500 dark:text-slate-400">No pricing data provided.</p>;
  return (
    <div className="space-y-3 text-sm">
      {Object.entries(data).map(([tier, value]) => (
        <div
          key={tier}
          className="rounded-lg border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60"
        >
          <h4 className="text-sm font-semibold text-slate-600 uppercase dark:text-slate-200">{tier}</h4>
          <pre className="mt-2 overflow-x-auto text-xs text-slate-600 dark:text-slate-300">
            {JSON.stringify(value, null, 2)}
          </pre>
        </div>
      ))}
    </div>
  );
}

export function ModelDetail({ model }: ModelDetailProps) {
  const capabilities = normalizeStringArray((model as any).model_capability ?? (model as any).modelCapability);
  const licenses = normalizeStringArray((model as any).license ?? (model as any).licenses);
  const releaseDateRaw = (model as any).release_date ?? (model as any).releaseDate;
  const priceData = (model as any).price_data ?? (model as any).priceData;
  const releaseDate = releaseDateRaw ? new Date(releaseDateRaw) : null;
  const modelUrl = (model as any).model_url ?? (model as any).modelUrl;

  return (
    <div className="space-y-8">
      <Card title={model.model} description={model.description} actions={<Badge color="primary">{model.vendor.name}</Badge>}>
        <div className="mt-4 space-y-6 text-sm text-slate-600 dark:text-slate-300">
          {modelUrl && (
            <div>
              <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Documentation</span>
              <a href={modelUrl} target="_blank" rel="noreferrer" className="block text-primary">
                {modelUrl}
              </a>
            </div>
          )}
          {releaseDate && !Number.isNaN(releaseDate.getTime()) && (
            <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Released {new Intl.DateTimeFormat("en", { year: "numeric", month: "long", day: "numeric" }).format(releaseDate)}
            </div>
          )}
          {capabilities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {capabilities.map((capability) => (
                <Badge key={capability}>{capability}</Badge>
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
          {model.note && <p className="text-sm text-slate-500 dark:text-slate-400">{model.note}</p>}
        </div>
      </Card>
      <Card title="Pricing" description="Raw pricing data across tiers and token types.">
        {renderPricing(priceData)}
      </Card>
    </div>
  );
}
