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
  };
}

const normalizeStringArray = (input?: unknown): string[] => {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
      }
    } catch (error) {
      // ignore JSON parse errors
    }
    return input.trim() ? [input.trim()] : [];
  }
  return [];
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

  if (!data) return <p className="text-sm text-slate-400">No pricing data provided.</p>;
  return (
    <div className="space-y-3 text-sm">
      {Object.entries(data).map(([tier, value]) => (
        <div key={tier} className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <h4 className="text-sm font-semibold text-slate-200 uppercase">{tier}</h4>
          <pre className="mt-2 overflow-x-auto text-xs text-slate-300">{JSON.stringify(value, null, 2)}</pre>
        </div>
      ))}
    </div>
  );
}

export function ModelDetail({ model }: ModelDetailProps) {
  const capabilities = normalizeStringArray(model.model_capability);
  const licenses = normalizeStringArray(model.license);

  return (
    <div className="space-y-8">
      <Card title={model.model} description={model.description} actions={<Badge color="primary">{model.vendor.name}</Badge>}>
        <div className="mt-4 space-y-6 text-sm text-slate-300">
          {model.model_url && (
            <div>
              <span className="text-xs uppercase tracking-wide text-slate-400">Documentation</span>
              <a href={model.model_url} target="_blank" rel="noreferrer" className="block text-primary">
                {model.model_url}
              </a>
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
          {model.note && <p className="text-sm text-slate-400">{model.note}</p>}
        </div>
      </Card>
      <Card title="Pricing" description="Raw pricing data across tiers and token types.">
        {renderPricing(model.price_data)}
      </Card>
    </div>
  );
}
